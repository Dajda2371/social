module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // If you are using the React Compiler, you might need this plugin
      // But for now, let's stick to the basics to get it running
    ],
  };
};
