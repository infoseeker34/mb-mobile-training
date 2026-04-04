module.exports = {
  env: {
    browser: false,
    es2021: true,
    'react-native/react-native': true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'react-native'],
  settings: {
    react: { version: 'detect' },
  },
  globals: {
    __DEV__: 'readonly',
    fetch: 'readonly',
    atob: 'readonly',
    process: 'readonly',
  },
  rules: {
    // Catch any future console leaks at lint-time
    'no-console': 'error',

    // React
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/react-in-jsx-scope': 'off',

    // Hooks
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',

    // React Native
    'react-native/no-unused-styles': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',

    // General
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
