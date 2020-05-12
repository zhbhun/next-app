# @next-app/config

> 本说明文档是针对 @next-app/config@1.x 编写的，如果您使用的 @next-app/config@0.x 请查看 [0.x 分支](https://github.com/zhbhun/next-app/tree/0.x/packages/next-app-config)。

## 使用说明

```js
const withApp = require('@next-app/config');

module.exports = withApp({
  distDir: '.next', // 构建输出路径
  assetPrefix: '/', // 静态资源前缀路径
  inlineImageLimit: 8192, // 图片 Base64 转换大小限制
  cssLocalIdentName: '[hash:base64:5]', // css module 的类名生成策略
  native: {}, // webpack 原生配置，可以合并到内置的 webapck 配置文件中
  webpack: function (webpackConfig, options) {
    // custom webpack config
    return webpackConfig;
  }, // 通过代码操作来定制 webpack 配置
  env: { // 按运行环境来区分配置，会覆盖上面的配置项
    development: {}, // 开发环境
    production: {} // 生产环境
  }
});
```
