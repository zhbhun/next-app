const cssLoaderConfig = require('./css-loader-config')

module.exports = (nextConfig = {}) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        )
      }

      const { dev, isServer } = options
      const { cssModules, cssLoaderOptions, postcssLoaderOptions } = nextConfig

      options.defaultLoaders.css = cssLoaderConfig(config, {
        extensions: ['css'],
        cssModules: false, // # 必须使用特殊的后缀才能开启 CSS Module，见下文配置
        cssLoaderOptions,
        postcssLoaderOptions,
        dev,
        isServer
      })

      // # module.css 支持 CSS Module
      options.defaultLoaders.mcss = cssLoaderConfig(config, {
        // extensions: ['css'],
        cssModules: true,
        cssLoaderOptions,
        postcssLoaderOptions,
        dev,
        isServer
      })

      config.module.rules.push(
        {
          test: /\.css$/,
          exclude: /\.module\.css$/, // # 排除 modul.css
          use: options.defaultLoaders.css
        },
        {
          test: /\.module\.css$/, // # module.css 支持 CSS Module
          use: options.defaultLoaders.mcss
        }
      )

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options)
      }

      return config
    }
  })
}
