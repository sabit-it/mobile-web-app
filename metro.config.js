const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['web', 'ios', 'android'];

const rnDir = path.resolve(__dirname, 'node_modules/react-native');
const rnwDir = path.resolve(__dirname, 'node_modules/react-native-web');
const emptyStub = path.resolve(__dirname, 'web-stubs/empty.js');
const appSrcDir = path.resolve(__dirname, 'src');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web') {
    return context.resolveRequest(context, moduleName, platform);
  }

  // For relative imports from app src, prefer .web.tsx/.web.ts/.web.js over the generic file
  if (moduleName.startsWith('.')) {
    const originDir = path.dirname(context.originModulePath);
    const base = path.resolve(originDir, moduleName);
    if (base.startsWith(appSrcDir)) {
      for (const ext of ['.web.tsx', '.web.ts', '.web.jsx', '.web.js']) {
        const candidate = base + ext;
        if (fs.existsSync(candidate)) {
          return { filePath: candidate, type: 'sourceFile' };
        }
      }
    }
  }

  // Stub react-native-maps on web (native-only, crashes browser)
  if (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/')) {
    return { filePath: emptyStub, type: 'sourceFile' };
  }

  // Redirect top-level react-native → react-native-web
  if (moduleName === 'react-native') {
    return context.resolveRequest(context, 'react-native-web', platform);
  }

  // Redirect react-native/Libraries/... absolute imports
  if (moduleName.startsWith('react-native/')) {
    const sub = moduleName.slice('react-native/'.length);
    try {
      return context.resolveRequest(context, `react-native-web/${sub}`, platform);
    } catch {
      return { filePath: emptyStub, type: 'sourceFile' };
    }
  }

  // Redirect relative imports FROM inside react-native package → react-native-web equivalents
  const origin = context.originModulePath;
  if (origin && origin.startsWith(rnDir + '/') && !origin.startsWith(rnwDir + '/')) {
    const originDir = path.dirname(origin);
    const absolute = path.resolve(originDir, moduleName);
    if (absolute.startsWith(rnDir + '/')) {
      const relToRn = absolute.slice(rnDir.length + 1); // e.g. Libraries/Utilities/Platform
      const rnwExport = relToRn.replace(/^Libraries\//, '');
      const candidates = [
        path.join(rnwDir, 'dist/exports', rnwExport),
        path.join(rnwDir, 'dist/cjs/exports', rnwExport),
        path.join(rnwDir, 'src', rnwExport),
      ];
      for (const candidate of candidates) {
        try {
          const resolved = require.resolve(candidate);
          return { filePath: resolved, type: 'sourceFile' };
        } catch {
          // try next
        }
      }
      // Nothing matched — stub it out so the bundle can proceed
      return { filePath: emptyStub, type: 'sourceFile' };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
