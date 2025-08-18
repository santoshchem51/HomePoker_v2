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
    'build',
    '*.log',
    '*.lock',
    'validation-reports',
    'test-*.js',
    'debug-*.js',
    'direct-*.js',
  ],
  rules: {
    // Relax rules for CI/CD pipeline - treat most issues as warnings
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }],
    'react-hooks/exhaustive-deps': 'warn', 
    'react-native/no-inline-styles': 'warn',
    'no-bitwise': 'warn',
    'no-script-url': 'warn',
    'no-void': 'warn',
    '@typescript-eslint/no-shadow': 'warn',
    'react-native/no-unused-styles': 'warn',
  },
  overrides: [
    {
      // Test files and setup files - more lenient rules
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*', '**/tests/**/*', '**/setup.js', '**/jest.config.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        'react-hooks/exhaustive-deps': 'off',
        'no-bitwise': 'off',
        'no-script-url': 'off',
      },
    },
    {
      // Validation and utility scripts - very lenient
      files: ['validation-reports/**/*', 'test-*.js', 'debug-*.js', 'direct-*.js'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'off',
        'no-console': 'off',
      },
    },
  ],
};
