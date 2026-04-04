#!/usr/bin/env node
/**
 * AI Test Failure Analyzer (CI job)
 *
 * Runs after the test job fails. Reads the Jest output, diagnoses
 * each failing test, and posts a diagnostic comment on the PR.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   GH_TOKEN
 *   PR_NUMBER
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const { PR_NUMBER, GH_TOKEN } = process.env;

if (!PR_NUMBER) {
  console.log('Not in a PR context, skipping failure analysis.');
  process.exit(0);
}

// Read test output from artifact (downloaded by CI) or try running tests
let testOutput = '';
if (existsSync('./jest-output.txt')) {
  testOutput = readFileSync('./jest-output.txt', 'utf8');
} else {
  console.log('No jest-output.txt found, running tests to capture output...');
  try {
    execSync('npm run test:ci 2>&1 | tee jest-output.txt', { encoding: 'utf8' });
  } catch (err) {
    testOutput = err.stdout || '';
  }
}

if (!testOutput || !testOutput.includes('FAIL')) {
  console.log('No test failures found, skipping analysis.');
  process.exit(0);
}

console.log('\n🤖 Analyzing test failures...\n');

let analysisComment = '';

for await (const message of query({
  prompt: `
You are a senior engineer diagnosing failing Jest tests in a React Native app.

Here is the Jest test output:
\`\`\`
${testOutput.slice(0, 8000)}
\`\`\`

For each FAILING test:
1. Identify the root cause (not just "expected X but got Y" — explain WHY)
2. Read the relevant source file and test file to understand the context
3. Suggest a specific, actionable fix with the exact code change needed

Format your response as a GitHub PR comment:

## 🔴 Test Failure Analysis

### Test: \`[test name]\`
**File:** \`path/to/test.js\`
**Root Cause:** Concise explanation of why it's failing (not just what failed)
**Fix:**
\`\`\`js
// Specific code change to make this test pass
\`\`\`

---

Keep each fix concise and actionable. If multiple tests fail for the same reason,
group them together. If the issue is in the source code (not the test), make that clear.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Glob', 'Grep'],
  },
})) {
  if ('result' in message) {
    analysisComment = message.result;
  }
}

if (!analysisComment) {
  console.log('No analysis generated.');
  process.exit(0);
}

try {
  const body = analysisComment.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  execSync(
    `gh pr comment ${PR_NUMBER} --body "${body}"`,
    { env: { ...process.env, GH_TOKEN }, encoding: 'utf8' }
  );
  console.log('✅ Failure analysis posted to PR.');
} catch (err) {
  console.error('Could not post PR comment:', err.message);
  console.log('\nAnalysis:\n', analysisComment);
}
