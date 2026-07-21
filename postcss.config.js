// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-svgo')(require('./svgo.config.js')),
    // other PostCSS plugins can be added here
  ],
};
