module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@config': './src/config',
            '@contexts': './src/contexts',
            '@assets': './assets',
          },
        },
      ],
      ['module:react-native-dotenv', {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        allowlist: null,
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      }],
      'react-native-reanimated/plugin',
    ],
  };
};