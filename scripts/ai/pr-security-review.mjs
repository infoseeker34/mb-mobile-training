#!/usr/bin/env node
/**
 * AI PR Security Review (CI job)
 *
 * Runs as a GitHub Actions job on pull requests.
 * Reviews only the files changed in the PR for security issues,
 * then posts a comment if any are found.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — Claude API key (GitHub Secret)
 *   GH_TOKEN           — GitHub token for posting comments
 *   PR_NUMBER          — Pull request number
 *   BASE_SHA           — Base commit SHA to diff against
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';

const { PR_NUMBER, BASE_SHA, GH_TOKEN } = process.env;

if (!PR_NUMBER || !BASE_SHA) {
  console.log('Not in a PR context, skipping security review.');
  process.exit(0);
}

// Get changed JS files
let changedFiles;
try {
  changedFiles = execSync(
    `git diff --name-only ${BASE_SHA} HEAD -- 'src/**/*.js'`,
    { encoding: 'utf8' }
  ).trim();
} catch {
  console.log('Could not get changed files, skipping.');
  process.exit(0);
}

if (!changedFiles) {
  console.log('No JS source files changed, skipping security review.');
  process.exit(0);
}

console.log(`\n🔍 AI security review for changed files:\n${changedFiles}\n`);

let reviewComment = '';

for await (const message of query({
  prompt: `
You are a security engineer reviewing a pull request for a React Native mobile app.

The following source files were changed in this PR:
${changedFiles}

For each changed file:
1. Read the current version of the file
2. Check ONLY the changed/new code (not pre-existing code) for these issues:
   - PII being logged (tokens, emails, profile data)
   - Hardcoded secrets or credentials
   - User input passed to APIs without validation
   - HTTP (not HTTPS) endpoint usage
   - Sensitive data in AsyncStorage instead of SecureStore
   - Missing error handling on auth operations
   - console.log statements (should use logger instead)

If you find NO issues, respond with exactly: "No security issues found in this PR."

If you find issues, format your response as a GitHub markdown comment:

## 🔒 AI Security Review

Found the following issues in changed files:

### \`path/to/file.js\`
- **Line X** [HIGH]: Description of issue
  \`\`\`js
  // problematic code
  \`\`\`
  **Fix:** description of fix

---
*This is an automated review. Please address before merging.*

Be concise. Only flag real issues, not style preferences.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Bash'],
  },
})) {
  if ('result' in message) {
    reviewComment = message.result;
  }
}

if (!reviewComment || reviewComment.includes('No security issues found')) {
  console.log('✅ No security issues found in PR changes.');
  process.exit(0);
}

// Post comment to PR
try {
  const body = reviewComment.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  execSync(
    `gh pr comment ${PR_NUMBER} --body "${body}"`,
    { env: { ...process.env, GH_TOKEN }, encoding: 'utf8' }
  );
  console.log('✅ Security review comment posted to PR.');
} catch (err) {
  console.error('Could not post PR comment:', err.message);
  console.log('\nReview output:\n', reviewComment);
}
