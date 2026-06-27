// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-svgo')(require('./svgo.config.js')),
    // other PostCSS plugins can be added here
  ],
};
