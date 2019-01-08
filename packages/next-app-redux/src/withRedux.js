import React, { Component } from 'react';

// eslint-disable-next-line
let _Promise = Promise;
const _debug = false;
const DEFAULT_KEY = '__NEXT_REDUX_STORE__';
const isServer = typeof window === 'undefined';

export const setPromise = Promise => (_Promise = Promise);

/**
 * @param makeStore
 * @param initialState
 * @param config
 * @param ctx
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

/**
 * @param makeStore
 * @param config
 * @return {function(App): {getInitialProps, new(): WrappedApp, prototype: WrappedApp}}
 */
export default (makeStore, config = {}) => {
  config = {
    storeKey: DEFAULT_KEY,
    debug: _debug,
    serializeState: state => state,
    deserializeState: state => state,
    ...config,
  };

  return App =>
    class WrappedApp extends Component {
      static displayName = `withRedux(${App.displayName || App.name || 'App'})`;

      static getInitialProps = async appCtx => {
        if (!appCtx) throw new Error('No app context');
        if (!appCtx.ctx) throw new Error('No page context');

        const modelArray = [];
        const modelMap = {};
        const modelsNs = Object.keys(appCtx.Component.models || {}).reduce(
          (rcc, key) => {
            const Model = appCtx.Component.models[key];
            const model = new Model(appCtx.ctx.query._ || '0');
            modelArray.push(model);
            rcc[key] = model.namespace;
            modelMap[key] = model;
            return rcc;
          },
          {}
        );
        const store = initStore({
          makeStore,
          config,
          ctx: appCtx.ctx,
          models: modelArray,
        });
        if (process.browser && store) {
          store.model(modelArray);
        }

        if (config.debug)
          console.log(
            '1. WrappedApp.getInitialProps wrapper got the store with state',
            store.getState()
          );

        appCtx.ctx.store = store;
        appCtx.ctx.isServer = isServer;
        appCtx.ctx.models = modelMap;

        let initialProps = {};

        if ('getInitialProps' in App) {
          initialProps = await App.getInitialProps.call(App, appCtx);
        }

        if (config.debug)
          console.log(
            '3. WrappedApp.getInitialProps has store state',
            store.getState()
          );

        return {
          store,
          isServer,
          models: modelsNs,
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

      constructor(props, context) {
        super(props, context);

        // eslint-disable-next-line
        let { initialState, store, models: modelsNs } = props;

        const hasStore = store && 'dispatch' in store && 'getState' in store;
        const modelArray = [];
        const models = Object.keys(modelsNs).reduce((rcc, key) => {
          const model =
            (hasStore && store.model(modelsNs[key])) ||
            new props.Component.models[key](props.router.query._ || '0');
          modelArray.push(model);
          rcc[key] = model;
          return rcc;
        }, {});

        // TODO Always recreate the store even if it could be reused? @see https://github.com/zeit/next.js/pull/4295#pullrequestreview-118516366
        store = hasStore
          ? store
          : initStore({
              makeStore,
              initialState,
              config,
              models: modelArray,
            });

        if (config.debug)
          console.log(
            '4. WrappedApp.render',
            hasStore ? 'picked up existing one,' : 'created new store with',
            'initialState',
            initialState
          );

        this.store = store;
        this.models = models;
      }

      componentWillReceiveProps(nextProps) {
        if (nextProps.models !== this.props.models) {
          // eslint-disable-next-line
          const { store, models: modelsNs, Component, router } = nextProps;
          const modelArray = [];
          const models = Object.keys(modelsNs).reduce((rcc, key) => {
            const model =
              store.model(modelsNs[key]) ||
              new Component.models[key](router.query._);
            modelArray.push(model);
            rcc[key] = model;
            return rcc;
          }, {});
          this.models = models;
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
