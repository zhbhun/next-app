const merge = require('lodash/merge');
const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const withCSS = require('../vendors/next-css');
const withSass = require('../vendors/next-sass');
const withBundleAnalyzer = require('../vendors/next-bundle-analyzer');
const withNative = require('./withNative');

const defaultConfig = require('./defaultConfig');

const postcssPlugins = () => {
  const plugins = [require('autoprefixer')()];
  if (process.env.NODE_ENV !== 'development') {
    plugins.push(
      require('cssnano')({
        preset: 'default',
      })
    );
  }
  return plugins;
};

/**
 * @param {Object} config
 * @param {String} config.distDir @see https://github.com/zeit/next.js/tree/7.0.2/#setting-a-custom-build-directory
 * @param {String} config.assetPrefix @see https://github.com/arefaslani/next-images#assetprefix
 * @param {Number} config.inlineImageLimit @see https://github.com/arefaslani/next-images#inlineimagelimit
 * @param {String} config.cssLocalIdentName @see https://github.com/zeit/next-plugins/tree/master/packages/next-css#with-css-modules-and-options
 * @param {Object|Function} config.native @see https://webpack.js.org/configuration/
 * @param {Object} config.webpack
 * @param {Object} config.env 根据环境读取不同配置
 * @param {Object} config.env.development
 * @param {Object} config.env.production
 */
module.exports = (config = defaultConfig) => {
  config =
    config === defaultConfig ? defaultConfig : merge({}, defaultConfig, config);
  const {
    distDir,
    analyzer,
    assetPrefix,
    inlineImageLimit,
    cssLocalIdentName,
    native,
  } = merge({}, config, config.env[process.env.NODE_ENV]);
  const postcssLoaderOptions = {
    plugins: postcssPlugins(),
  };
  return withPlugins(
    [
      [
        withBundleAnalyzer,
        {
          analyzer,
        },
      ],
      [
        withImages,
        {
          assetPrefix,
          inlineImageLimit,
        },
      ],
      [
        withCSS,
        {
          cssLoaderOptions: {
            url: true,
            import: false,
            localIdentName: cssLocalIdentName,
          },
          postcssLoaderOptions,
        },
      ],
      [
        withSass,
        {
          cssLoaderOptions: {
            url: true,
            import: false,
            localIdentName: cssLocalIdentName,
          },
          postcssLoaderOptions,
        },
      ],
      [withNative, { native }],
    ],
    {
      distDir,
      webpack(webpackConfig, options) {
        if (!options.defaultLoaders) {
          throw new Error(
            'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
          );
        }

        const { isServer } = options;

        // 解决有些移动端的应用根据 URL 缓存静态资源的问题
        // https://github.com/zeit/next.js/blob/7.0.2/build/webpack.js#L198
        webpackConfig.output.chunkFilename = isServer
          ? ''.concat('[name].[contenthash]', '.js')
          : 'static/chunks/'.concat('[name].[contenthash]', '.js');

        // 为了解决移动端应用的静态资源缓存问题，开发环境给每个静态资源增加了时间戳，导致调试断点经常失效，采用 eval 方式的 sourcemap 不会单独生成 map 文件，可以解决该问题。
        if (webpackConfig.devtool) {
          webpackConfig.devtool = !isServer
            ? 'eval'
            : 'cheap-module-source-map';
        }

        if (typeof config.webpack === 'function') {
          return config.webpack(webpackConfig, options);
        }

        return webpackConfig;
      },
    }
  );
};
