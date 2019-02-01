import url from 'url';
import NProgress from 'nprogress';
import Router from 'next/router';
import React, { Children, cloneElement, PureComponent } from 'react';

const getRouteKey = key => key || '0';

export default App => {
  class StackRouter extends PureComponent {
    static getInitialProps = App.getInitialProps;

    constructor(props) {
      super(props);

      const { Component, pageProps, router, ...restProps } = this.props;
      const routeKey = getRouteKey(router.query._);
      this.state = {
        current: 0,
        routeKeys: [routeKey],
        routes: [
          <section
            key={routeKey}
            data-key={routeKey}
            style={{ ...styles.page, ...styles.activePage }}
          >
            <Component {...restProps} {...pageProps} router={router} visible />
          </section>,
        ],
      };
    }

    componentDidMount() {
      Router.events.on('beforeHistoryChange', this.onBeforeHistoryChange);
      Router.events.on('routeChangeStart', this.onRouteChangeStart);
      Router.events.on('routeChangeComplete', this.onRouteChangeComplete);
      Router.events.on('routeChangeError', this.onRouteChangeError);
    }

    componentWillReceiveProps(nextProps) {
      const { Component, pageProps, ...restProps } = nextProps;
      this.setState(state => {
        const currRoute = state.routes[state.current];
        const currRouteKey = Number(currRoute.key);
        const nextRouteKey = Number(getRouteKey(nextProps.router.query._));
        if (currRouteKey !== nextRouteKey) {
          let current = state.current;
          const routeKeys = state.routeKeys.slice(0);
          const routes = state.routes.map(route =>
            cloneElement(route, {
              style: {
                ...styles.page,
                ...((route.key || '0') === String(nextRouteKey)
                  ? styles.activePage
                  : {}),
              },
              children: cloneElement(Children.only(route.props.children), {
                visible: (route.key || '0') === String(nextRouteKey),
              }),
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
          if (!isExist) {
            const newRoute = (
              <section
                key={nextRouteKey}
                data-key={nextRouteKey}
                style={{ ...styles.page, ...styles.activePage }}
              >
                <Component
                  {...restProps}
                  {...pageProps}
                  router={nextProps.router}
                  visible
                />
              </section>
            );
            if (nextRouteKey > currRouteKey) {
              current += 1;
              routeKeys.splice(
                current,
                routeKeys.length - current,
                String(nextRouteKey)
              );
              routes.splice(current, routes.length - current, newRoute);
            } else {
              routeKeys.splice(current, routeKeys.length, String(nextRouteKey));
              routes.splice(current, routes.length, newRoute);
            }
          } else {
            current = existIndex;
            routeKeys.splice(existIndex + 1, routeKeys.length);
            routes.splice(existIndex + 1, routes.length);
          }
          return {
            current,
            routeKeys,
            routes,
          };
        } else {
          const newRoute = (
            <section
              key={nextRouteKey}
              data-key={nextRouteKey}
              style={{ ...styles.page, ...styles.activePage }}
            >
              <Component
                {...restProps}
                {...pageProps}
                router={nextProps.router}
                visible
              />
            </section>
          );
          const routes = state.routes.slice(0);
          routes.splice(state.current, 1, newRoute);
          return { routes };
        }
      });
    }

    componentWillUnmount() {
      Router.events.off('beforeHistoryChange', this.onBeforeHistoryChange);
      Router.events.off('routeChangeStart', this.onRouteChangeStart);
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
              style: {
                ...styles.page,
                ...((route.key || '0') === String(nextRouteKey)
                  ? styles.activePage
                  : {}),
              },
              children: cloneElement(Children.only(route.props.children), {
                visible: (route.key || '0') === String(nextRouteKey),
              }),
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
          if (!isExist) {
            const newRoute = (
              <section
                key={nextRouteKey}
                data-key={nextRouteKey}
                style={{ ...styles.page, ...styles.activePage }}
              >
                <div />
              </section>
            );
            if (nextRouteKey > currRouteKey) {
              current += 1;
              routeKeys.splice(
                current,
                routeKeys.length - current,
                String(nextRouteKey)
              );
              routes.splice(current, routes.length - current, newRoute);
            } else {
              routeKeys.splice(current, routeKeys.length, String(nextRouteKey));
              routes.splice(current, routes.length, newRoute);
            }
          } else {
            current = existIndex;
            routeKeys.splice(existIndex + 1, routeKeys.length);
            routes.splice(existIndex + 1, routes.length);
          }
          return {
            current,
            routeKeys,
            routes,
          };
        }
        return {};
      });
    };

    onRouteChangeStart = () => NProgress.start();

    onRouteChangeComplete = () => NProgress.done();

    onRouteChangeError = () => NProgress.done();

    render() {
      return (
        <App {...this.props}>
          <div>{this.state.routes}</div>
        </App>
      );
    }
  }

  return StackRouter;
};

const styles = {
  page: {
    display: 'none',
    position: 'fixed',
    zIndex: '0',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
    overflowScrolling: 'touch',
    WebkitOverflowScrolling: 'touch',
  },
  activePage: {
    display: 'block',
  },
};
