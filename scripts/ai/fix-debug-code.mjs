#!/usr/bin/env node
/**
 * AI Debug Code Cleanup
 *
 * Uses the Claude Agent SDK to replace all remaining console.* calls
 * with the logger service, remove PII-leaking logs, and fix other debug issues.
 *
 * Usage:
 *   node scripts/ai/fix-debug-code.mjs
 *   npm run ai:fix-debug
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

console.log('\n🧹 Running AI debug code cleanup...\n');

for await (const message of query({
  prompt: `
You are cleaning up debug code in a React Native production app.

The logger service is at src/services/utils/logger.js and exports:
  logger.debug(...args)  — replaces console.log
  logger.info(...args)   — replaces console.log for important events
  logger.warn(...args)   — replaces console.warn
  logger.error(...args)  — replaces console.error

Tasks (apply to ALL files in src/):

1. **Replace console.log** → logger.debug (or logger.info for important events like auth success)
   Add "import logger from '../services/utils/logger';" (adjust relative path) if not already imported.

2. **Replace console.error** → logger.error

3. **Replace console.warn** → logger.warn

4. **DELETE any console.log lines that output**:
   - Tokens (access token, refresh token, id token, JWT payloads)
   - Profile data being sent to API
   - Auth state (logged in/out messages in detail)
   - User personal info (email, phone, name)
   These must be removed entirely, not just replaced with logger.

5. **Replace native alert()** with Alert.alert() from react-native
   (check for bare alert() calls, not Alert.alert)

6. **Wrap MOCK_* constant usages** in if (__DEV__) { } if they still exist.

Do each file individually. Check the relative path for the logger import carefully —
it depends on how deep the file is in src/.

After making changes, verify no console.log/error/warn remain in src/ by searching.
Report a summary of all changes made.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Edit', 'Glob', 'Grep', 'Bash'],
    permissionMode: 'acceptEdits',
  },
})) {
  if ('result' in message) {
    console.log('\n✅ Debug code cleanup complete!\n');
    console.log(message.result);
  }
}
