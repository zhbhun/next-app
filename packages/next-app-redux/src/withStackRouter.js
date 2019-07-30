import url from 'url';
import NProgress from 'nprogress';
import Router from 'next/router';
import React, { cloneElement, PureComponent } from 'react';

const getRouteKey = key => key || '0';
const RoutePage = ({ children, Component, visible, ...restProps }) => {
  return (
    <section className={`next-route${visible ? ' next-route-active' : ''}`}>
      {Component ? <Component {...restProps} visible={visible} /> : children}
    </section>
  );
};
const destroyRoutes = (routes, store) => {
  if (routes && routes.length > 0) {
    let removingModels = [];
    for (let index = 0; index < routes.length; index += 1) {
      const route = routes[index];
      const models = route && route.props && route.props.models;
      if (models) {
        removingModels = removingModels.concat(
          Object.keys(models).reduce((rcc, key) => {
            const model = models[key];
            const Model = Object.getPrototypeOf(model).constructor;
            if (!Model.persist) {
              rcc.push(model);
            }
            return rcc;
          }, [])
        );
      }
    }
    if (removingModels && removingModels.length > 0) {
      store.unmodel(removingModels);
    }
  }
};

export default ({ App, RouterContainer }) => {
  class StackRouter extends PureComponent {
    static getInitialProps = App.getInitialProps;

    constructor(props) {
      super(props);

      const { pageProps, router, ...restProps } = this.props;
      const routeKey = getRouteKey(router.query._);
      this.state = {
        current: 0,
        routeKeys: [routeKey],
        routes: [
          <RoutePage
            {...restProps}
            {...pageProps}
            key={routeKey}
            router={router}
            visible
          />,
        ],
      };
    }

    componentDidMount() {
      NProgress.configure({ showSpinner: false });
      Router.events.on('beforeHistoryChange', this.onBeforeHistoryChange);
      Router.events.on('routeChangeComplete', this.onRouteChangeComplete);
      Router.events.on('routeChangeError', this.onRouteChangeError);
    }

    componentWillReceiveProps(nextProps) {
      const { pageProps, ...restProps } = nextProps;
      this.setState(state => {
        const currRoute = state.routes[state.current];
        const currRouteKey = Number(currRoute.key);
        const nextRouteKey = Number(getRouteKey(nextProps.router.query._));
        if (currRouteKey === nextRouteKey) {
          // 在 beforeHistoryChange 事件处理时已经同步好路由，这里只要替换下组件就可以了
          const newRoute = (
            <RoutePage
              {...restProps}
              {...pageProps}
              key={nextRouteKey}
              router={nextProps.router}
              visible
            />
          );
          const routes = state.routes.slice(0);
          routes.splice(state.current, 1, newRoute);
          return { routes };
        }
        return {};
      });
    }

    componentWillUnmount() {
      Router.events.off('beforeHistoryChange', this.onBeforeHistoryChange);
      Router.events.off('routeChangeComplete', this.onRouteChangeComplete);
      Router.events.off('routeChangeError', this.onRouteChangeError);
    }

    onBeforeHistoryChange = newURL => {
      const router = url.parse(newURL, true);
      this.setState(state => {
        const currRoute = state.routes[state.current];
        const currRouteKey = Number(currRoute.key);
        const nextRouteKey = Number(getRouteKey(router.query._));
        if (currRouteKey !== nextRouteKey) {
          let current = state.current;
          const routeKeys = state.routeKeys.slice(0);
          const routes = state.routes.map(route =>
            cloneElement(route, {
              visible: getRouteKey(route.key) === String(nextRouteKey),
            })
          );
          let existIndex = -1;
          const isExist = state.routes.some((route, index) => {
            if (Number(route.key) === nextRouteKey) {
              existIndex = index;
              return true;
            }
            return false;
          });
          let removedRoutes;
          if (!isExist) {
            this.onRouteChangeStart();
            const newRoute = <RoutePage key={nextRouteKey} visible />;
            if (nextRouteKey > currRouteKey) {
              current += 1;
              routeKeys.splice(
                current,
                routeKeys.length - current,
                String(nextRouteKey)
              );
              removedRoutes = routes.splice(
                current,
                routes.length - current,
                newRoute
              );
            } else {
              routeKeys.splice(current, routeKeys.length, String(nextRouteKey));
              removedRoutes = routes.splice(current, routes.length, newRoute);
            }
          } else {
            current = existIndex;
            routeKeys.splice(existIndex + 1, routeKeys.length);
            removedRoutes = routes.splice(existIndex + 1, routes.length);
          }
          destroyRoutes(removedRoutes, this.props.store);
          return {
            current,
            routeKeys,
            routes,
          };
        } else {
          // eslint-disable-next-line
          if (window.location.pathname !== router.pathname) {
            // 判断当前路由地址是否变更，有的话需要显示加载进度条
            this.onRouteChangeStart();
            const newRoute = <RoutePage key={nextRouteKey} visible />;
            const routes = state.routes.slice(0);
            const removedRoutes = routes.splice(state.current, 1, newRoute);
            destroyRoutes(removedRoutes, this.props.store);
            return { routes };
          }
        }
        return {};
      });
    };

    onRouteChangeStart = () => NProgress.start();

    onRouteChangeComplete = () => NProgress.done();

    onRouteChangeError = () => NProgress.done();

    render() {
      const { current, routes } = this.state;
      let content = null;
      if (RouterContainer) {
        content = <RouterContainer current={current}>{routes}</RouterContainer>;
      } else {
        content = <div>{routes}</div>;
      }
      return <App {...this.props}>{content}</App>;
    }
  }

  return StackRouter;
};
