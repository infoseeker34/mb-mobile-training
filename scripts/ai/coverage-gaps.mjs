#!/usr/bin/env node
/**
 * AI Coverage Gap Filler
 *
 * After running `npm run test:coverage`, this agent reads the coverage report,
 * identifies files below 80% coverage, and writes additional test cases.
 *
 * Usage:
 *   npm run test:coverage   # generate coverage first
 *   node scripts/ai/coverage-gaps.mjs
 *   npm run ai:coverage-gaps
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { existsSync } from 'fs';

if (!existsSync('./coverage/coverage-summary.json')) {
  console.error('❌ No coverage report found. Run `npm run test:coverage` first.');
  process.exit(1);
}

console.log('\n📊 Analyzing coverage gaps...\n');

for await (const message of query({
  prompt: `
You are a senior React Native engineer improving test coverage.

1. Read the coverage report at coverage/coverage-summary.json
2. Parse it and list all files where "lines.pct" is below 80%
3. Sort them by coverage percentage ascending (lowest first)
4. For the 5 lowest-covered files:
   a. Read the source file to understand what needs testing
   b. Find the existing test file (in __tests__ subfolder with same filename)
   c. Read the existing test file if it exists
   d. Write additional test cases that cover the uncovered branches and lines
   e. Append them to the existing test file (don't overwrite existing tests)
   f. Focus on: uncovered branches, untested error paths, edge cases

Prioritize coverage of:
- branches (if/else paths, ternaries, optional chaining)
- error handling (catch blocks)
- null/undefined inputs
- empty array/object inputs

After writing tests, report:
- Which files were targeted
- What scenarios were added
- Estimated new coverage percentage per file

Important: Do not add tests for dead code or code paths that are intentionally
unreachable. Focus on real coverage gaps.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Write', 'Edit', 'Glob'],
    permissionMode: 'acceptEdits',
  },
})) {
  if ('result' in message) {
    console.log('\n✅ Coverage gaps filled!\n');
    console.log(message.result);
  }
}
