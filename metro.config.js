const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for PokePot
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    // Enable hot reloading
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Add development headers
        res.setHeader('Cache-Control', 'no-cache');
        return middleware(req, res, next);
      };
    },
  },
  resolver: {
    alias: {
      // Path mapping for cleaner imports
      '@': './src',
      '@components': './src/components',
      '@services': './src/services',
      '@utils': './src/utils',
      '@types': './src/types',
    },
  },
  transformer: {
    // Enable TypeScript and environment variable support
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    // Watch additional directories for changes
    './src',
    './database',
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
