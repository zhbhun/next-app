module.exports = {
  distDir: '.next/production',
  analyzer: true,
  assetPrefix: '',
  inlineImageLimit: 8192,
  cssLocalIdentName: '[hash:base64:5]',
  native: {},
  env: {
    development: {
      distDir: '.next/development',
      analyzer: false,
      inlineImageLimit: 1,
      cssLocalIdentName: '[local]-[hash:base64:5]',
    },
  },
};
