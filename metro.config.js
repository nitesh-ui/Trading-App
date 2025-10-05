/**
 * Metro Configuration for Production Optimization
 * Optimizes bundle size and performance
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable Hermes for better performance
  config.resolver.sourceExts.push('cjs');
  
  // Optimize bundle size
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    // Terser options for better minification
    mangle: {
      keep_fnames: false,
      keep_classnames: false,
    },
    compress: {
      drop_console: true, // Remove console.logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.warn', 'console.info'],
    },
    output: {
      comments: false,
    },
  };

  // Enable bundle splitting for better loading
  config.serializer.createModuleIdFactory = function () {
    const fileToIdMap = new Map();
    let nextId = 0;
    return (path) => {
      if (!fileToIdMap.has(path)) {
        fileToIdMap.set(path, nextId++);
      }
      return fileToIdMap.get(path);
    };
  };
}

// Asset optimization
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
];

// Enable symlinks for monorepo support
config.resolver.unstable_enableSymlinks = true;

// Add alias resolution for @/ paths
config.resolver.alias = {
  '@': __dirname,
};

// Optimize image assets
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Tree shaking configuration
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
