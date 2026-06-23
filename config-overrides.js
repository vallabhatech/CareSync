module.exports = function override(config, env) {
  // Disable fullySpecified rule for .mjs files to allow omitting extensions
  // This is required for @mui/material/internal and react-transition-group with Webpack 5
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: "javascript/auto",
    resolve: {
      fullySpecified: false
    }
  });

  return config;
};
