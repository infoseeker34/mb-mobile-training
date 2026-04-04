#!/usr/bin/env node
/**
 * AI Security Audit
 *
 * Uses the Claude Agent SDK to scan the entire codebase for security issues
 * and write a detailed markdown report.
 *
 * Usage:
 *   node scripts/ai/security-audit.mjs
 *   npm run ai:security
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

console.log('\n🔍 Running AI security audit...\n');

for await (const message of query({
  prompt: `
You are a mobile security expert auditing a React Native/Expo application.

Perform a comprehensive security audit of all files in src/ and write a detailed
report to security-audit-report.md at the project root.

For each finding include:
- File path and line number
- Severity: CRITICAL | HIGH | MEDIUM | LOW
- Description of the issue
- Recommended fix with code example

Scan for ALL of the following:

1. **PII in logs**: console.log/error/warn calls that output tokens, passwords,
   emails, profile data, or auth payloads. Even in __DEV__ blocks.

2. **Hardcoded secrets**: API keys, client IDs, passwords, signing keys anywhere
   in source code (Config.js is now env-driven but check for stragglers).

3. **Insecure HTTP endpoints**: Any http:// URLs in source (not localhost in dev).

4. **Insecure storage**: Sensitive data (tokens, passwords, PII) stored in
   AsyncStorage instead of expo-secure-store.

5. **Input injection vectors**: User input passed to eval(), Function(),
   dangerouslySetInnerHTML, or directly into URL construction without sanitization.

6. **Missing HTTPS enforcement**: API calls that could be made over HTTP in production.

7. **Token leakage**: Tokens passed in URLs, logged, or stored insecurely.

8. **Insecure random**: Math.random() used for security-sensitive values.

9. **Missing authentication checks**: API calls made without verifying auth state first.

10. **Dependency risks**: Any require()/import of deprecated or risky packages.

Format the report as:

# Security Audit Report
Generated: <date>

## Summary
<count> issues found: <X> CRITICAL, <X> HIGH, <X> MEDIUM, <X> LOW

## Findings

### [SEVERITY] Issue Title
**File:** path/to/file.js:lineNumber
**Description:** ...
**Fix:** ...
\`\`\`js
// corrected code
\`\`\`

---

## Resolved Items
List any items from the implementation plan that are already fixed.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Glob', 'Grep', 'Write'],
    permissionMode: 'acceptEdits',
  },
})) {
  if ('result' in message) {
    console.log('\n✅ Security audit complete! See security-audit-report.md\n');
    console.log(message.result);
  }
}
