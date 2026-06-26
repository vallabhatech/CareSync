// svgo.config.js
module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeDoctype: true
        }
      }
    },
    { name: 'cleanupAttrs' },
    { name: 'removeComments' },
    { name: 'removeMetadata' }
  ]
};
