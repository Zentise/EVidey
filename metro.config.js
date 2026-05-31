const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Stub expo-notifications during local dev (Expo Go SDK 53+ removed push support).
// EAS Build sets EAS_BUILD=true automatically, so production builds get real notifications.
const isEASBuild = Boolean(process.env.EAS_BUILD);

if (!isEASBuild) {
  const stubPath = require.resolve('./stubs/expo-notifications.js');
  const originalResolver = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (
      moduleName === 'expo-notifications' ||
      moduleName.startsWith('expo-notifications/')
    ) {
      return { type: 'sourceFile', filePath: stubPath };
    }
    if (originalResolver) {
      return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
