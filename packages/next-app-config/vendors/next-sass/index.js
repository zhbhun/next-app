const cssLoaderConfig = require('../next-css/css-loader-config')

module.exports = (nextConfig = {}) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        )
      }

      const { dev, isServer } = options
      const {
        cssModules,
        cssLoaderOptions,
        postcssLoaderOptions,
        sassLoaderOptions = {}
      } = nextConfig

      options.defaultLoaders.sass = cssLoaderConfig(config, {
        extensions: ['scss', 'sass'],
        cssModules: false, // # 必须使用特殊的后缀才能开启 CSS Module，见下文配置
        cssLoaderOptions,
        postcssLoaderOptions,
        dev,
        isServer,
        loaders: [
          {
            loader: 'sass-loader',
            options: sassLoaderOptions
          }
        ]
      })

      // # module.scss 或 module.sass 支持 CSS Module
      options.defaultLoaders.msass = cssLoaderConfig(config, {
        // extensions: ['scss', 'sass'],
        cssModules: true,
        cssLoaderOptions,
        postcssLoaderOptions,
        dev,
        isServer,
        loaders: [
          {
            loader: 'sass-loader',
            options: sassLoaderOptions
          }
        ]
      })

      config.module.rules.push(
        {
          test: /\.scss$/,
          exclude: /\.module\.scss$/, // # 排除 modul.scss
          use: options.defaultLoaders.sass
        },
        {
          test: /\.module\.scss$/, // # module.scss 支持 CSS Module
          use: options.defaultLoaders.msass
        },
        {
          test: /\.sass$/,
          exclude: /\.module\.sass$/, // # 排除 modul.sass
          use: options.defaultLoaders.sass
        },
        {
          test: /\.module\.sass$/, // # module.sass 支持 CSS Module
          use: options.defaultLoaders.msass
        }
      )

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  })
}
