module.exports = {
  distDir: '.next/production',
  assetPrefix: '',
  inlineImageLimit: 8192,
  cssLocalIdentName: '[hash:base64:5]',
  native: {},
  env: {
    development: {
      distDir: '.next/development',
      inlineImageLimit: 1,
      cssLocalIdentName: '[local]-[hash:base64:5]',
    },
  },
};
