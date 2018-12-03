const merge = require('webpack-merge');

/**
 * @param {Object} nextConfig
 * @param {Object} nextConfig.native
 */
module.exports = (nextConfig = {}) => {
  const { native, ...otherConfig } = nextConfig;
  if (native) {
    return Object.assign(otherConfig, {
      webpack(config, options) {
        if (!options.defaultLoaders) {
          throw new Error(
            'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
          );
        }

        config = merge(
          config,
          typeof native === 'function' ? native(options) : native
        );

        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, options);
        }

        return config;
      },
    });
  }
  return otherConfig;
};
