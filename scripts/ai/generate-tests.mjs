#!/usr/bin/env node
/**
 * AI Test Generator
 *
 * Uses the Claude Agent SDK to read a source file and generate a
 * comprehensive Jest test file for it.
 *
 * Usage:
 *   node scripts/ai/generate-tests.mjs src/services/utils/tokenManager.js
 *   npm run ai:gen-tests -- src/contexts/AuthContext.js
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import path from 'path';

const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Usage: node scripts/ai/generate-tests.mjs <path/to/source.js>');
  process.exit(1);
}

// Derive test file path
const dir = path.dirname(targetFile);
const base = path.basename(targetFile);
const testDir = path.join(dir, '__tests__');
const testFile = path.join(testDir, base);

console.log(`\n🤖 Generating tests for: ${targetFile}`);
console.log(`📝 Output: ${testFile}\n`);

for await (const message of query({
  prompt: `
You are a senior React Native engineer writing Jest unit tests.

Read the source file at: ${targetFile}

Then generate a comprehensive Jest test file and write it to: ${testFile}

Requirements:
- Use jest-expo preset patterns (already configured in package.json)
- Use @testing-library/react-native for any React component tests
- Mock native modules: expo-secure-store, expo-auth-session, @react-native-async-storage/async-storage are already mocked in jest.setup.js
- For API modules, mock apiClient using jest.mock('../apiClient', () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }))
- Target 80%+ branch coverage for the file
- Include: happy path, error cases, edge cases, boundary conditions
- For class-based services that are singletons, use jest.resetModules() and re-require in beforeEach
- Use descriptive test names in the format: "methodName — description of case"
- Add jest.clearAllMocks() in beforeEach
- Do NOT use console.log in tests

Before writing, check if a test file already exists at the output path. If it does, extend it rather than overwrite.

Write the test file now.
`,
  options: {
    cwd: process.cwd(),
    allowedTools: ['Read', 'Write', 'Glob', 'Grep'],
    permissionMode: 'acceptEdits',
  },
})) {
  if ('result' in message) {
    console.log('\n✅ Done!\n');
    console.log(message.result);
  }
}
