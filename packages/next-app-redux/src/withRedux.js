import React, { Component } from 'react';
import { createModels } from './utils';

// eslint-disable-next-line
const DEFAULT_KEY = '__NEXT_REDUX_STORE__';
const isServer = typeof window === 'undefined';

/**
 * @param makeStore 创建 Store 函数
 * @param initialState 初始化状态
 * @param config 配置
 * @param ctx 路由信息
 * @return {{getState: function, dispatch: function}}
 */
const initStore = ({ makeStore, initialState, config, ctx = {}, models }) => {
  const { storeKey } = config;

  const createStore = () =>
    makeStore(
      config.deserializeState(initialState),
      {
        ...ctx,
        ...config,
        isServer,
      },
      models
    );

  if (isServer) return createStore();

  // Memoize store if client
  if (!window[storeKey]) {
    window[storeKey] = createStore();
  }

  return window[storeKey];
};

const clearStore = config => {
  if (!isServer) {
    const { storeKey } = config;
    window[storeKey] = undefined;
  }
};

/**
 * @param makeStore
 * @param config
 * @return {function(App): {getInitialProps, new(): WrappedApp, prototype: WrappedApp}}
 */
export default (makeStore, config = {}) => {
  config = {
    storeKey: DEFAULT_KEY,
    serializeState: state => state,
    deserializeState: state => state,
    ...config,
  };

  return App =>
    class WrappedApp extends Component {
      static displayName = `withRedux(${App.displayName || App.name || 'App'})`;

      /**
       * 初始化
       *
       * 1. 服务端首屏渲染
       * 2. 打开新路由
       * 3. 替换当前路由
       * 4. 返回前一路由 TODO 返回前一路由时有缓存可以不用初始化
       *
       * @param {Object} appCtx
       * @param {Function} appCtx.Component 路由页面组件
       * @param {Object} appCtx.router 路由对象
       * @param {function} appCtx.router.onPopState 监听路由状态变化
       * @param {string} appCtx.router.route 路由信息
       * @param {string} appCtx.router.pathname 路由路径
       * @param {string} appCtx.router.query 查询参数
       * @param {string} appCtx.router.asPath 浏览器地址栏显示的路径 + 查询参数
       * @param {Object} appCtx.ctx 上下文信息
       * @param {Object} appCtx.ctx.err 错误信息
       * @param {Object} appCtx.ctx.req 请求对象（服务端才有）
       * @param {Object} appCtx.ctx.res 响应对象（服务端才有）
       * @param {string} appCtx.ctx.pathname 路由路径
       * @param {Object} appCtx.ctx.query 查询参数
       * @param {string} appCtx.ctx.asPath 浏览器地址栏显示的路径 + 查询参数
       */
      static getInitialProps = async appCtx => {
        if (!appCtx) throw new Error('No app context');
        if (!appCtx.ctx) throw new Error('No page context');

        // model
        const modelMap = createModels(appCtx.Component.models, appCtx.ctx);
        const modelArray = Object.keys(modelMap || {}).map(
          key => modelMap[key]
        );

        // store
        const store = initStore({
          makeStore,
          config,
          ctx: appCtx.ctx,
          models: modelArray,
        });
        if (process.browser && store) {
          // 客户端只有首屏才会执行 store 初始化，非首屏需要动态添加 model
          store.model(modelArray);
        }

        // 上下文更新
        appCtx.ctx.store = store;
        appCtx.ctx.models = modelMap;

        // 初始化
        let initialProps = {};
        if ('getInitialProps' in App) {
          initialProps = await App.getInitialProps.call(App, appCtx);
        }

        return {
          store: () => store,
          models: () => modelMap,
          initialState: config.serializeState(store.getState()),
          initialProps,
          headers: {
            userAgent:
              (isServer
                ? appCtx.ctx.req &&
                  appCtx.ctx.req.get &&
                  appCtx.ctx.req.get('User-Agent')
                : window.navigator.userAgent) || '',
          },
        };
      };

      /**
       * 以下三种情况会执行构造函数
       *
       * 1. 服务端首屏初始化
       * 2. 客户端首屏初始化
       * 3. _app 热更新
       *
       * @param {Object} props
       * @param {Object} props.Component
       * @param {Object} props.headers 请求头
       * @param {Object} props.initiateState 初始化状态
       * @param {Object} props.initialProps 初始化属性
       * @param {Object} props.router
       * @param {Function} props.store 获取服务端 store，首屏渲染时客户端不会调用 getInitiateProps，所以 store 为 undefined
       */
      constructor(props, context) {
        super(props, context);

        let store = props.store;
        let models = props.models;
        if (
          isServer &&
          typeof props.store === 'function' &&
          typeof models === 'function'
        ) {
          // 只有服务端才允许复用 getInitiateProps 返回的 store，客户端正常来说只会初始化一次，只有在开发环境热更新 _app 时才会重新初始化，这时候不能复用旧的 store
          store = store();
          models = models();
        } else {
          // 客户端首屏不会执行 App.getInitiateProps，需要在这里初始化 Store
          models = createModels(props.Component.models, props.router);
          const modelArray = Object.keys(models || {}).map(key => models[key]);
          clearStore(config); // 清除 Store 缓存（热更新时可能会出现 Store 缓存）
          store = initStore({
            makeStore,
            initialState: props.initiateState,
            config,
            models: modelArray,
          });
        }

        this.store = store;
        this.models = models;
      }

      /**
       * 以下两种情况会触发该生命周期函数
       *
       * 1. 路由更新
       * 2. 热更新替换 Component
       */
      componentWillReceiveProps(nextProps) {
        if (
          typeof nextProps.models === 'function' &&
          nextProps.models !== this.props.models
        ) {
          this.models = nextProps.models();
        }
        if (process.env.NODE_ENV === 'development') {
          // 处理路由页面组件热更新，更新 Model 实例
          const currKey = this.props.router.query._ || '0';
          const currRoute = this.props.router.route;
          const currComponent = this.props.Component;
          const nextKey = nextProps.router.query._ || '0';
          const nextRoute = nextProps.router.route;
          const nextComponent = nextProps.Component;
          if (
            currKey === nextKey &&
            currRoute === nextRoute &&
            nextProps.Component !== currComponent
          ) {
            const models = createModels(nextComponent.models, nextProps.router);
            this.store.model(Object.keys(models || {}).map(key => models[key]));
            currComponent.prototype.destroyModels = () => null;
            this.models = models;
          }
        }
      }

      render() {
        const { initialProps, initialState, store, ...props } = this.props;

        // Cmp render must return something like <Provider><Component/></Provider>
        return (
          <App
            {...props}
            {...initialProps}
            store={this.store}
            models={this.models}
          />
        );
      }
    };
};
