const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
  sourceExts: Array.from(new Set([...(config.resolver.sourceExts || []), 'cjs'])),
};

module.exports = config;