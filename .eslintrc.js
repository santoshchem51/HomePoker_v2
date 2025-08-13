module.exports = {
  root: true,
  extends: [
    '@react-native',
  ],
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  ignorePatterns: [
    'node_modules',
    'android',
    'ios',
    'coverage',
    '*.log',
    '*.lock',
  ],
  overrides: [
    {
      // Test files and setup files
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*', '**/tests/**/*', '**/setup.js', '**/jest.config.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
