import React from 'react';
import App, { Container } from 'next/app';
import { Provider } from 'react-redux';
import withRedux from './withRedux';
import withReduxSaga from './withReduxSaga';
import withStackRouter from './withStackRouter';

const defaultConfig = {
  async: true,
};

export default options => {
  let createStore;
  let config = defaultConfig;
  if (typeof options === 'function') {
    createStore = options;
  } else {
    createStore = options.createStore;
    config = {
      ...defaultConfig,
      ...options,
    };
  }
  class MYApp extends App {
    static async getInitialProps(props) {
      const { Component, ctx } = props;
      let pageProps = {};
      if (Component.getInitialProps) {
        pageProps = await Component.getInitialProps(ctx);
      }
      return { pageProps };
    }

    render() {
      const { store, children } = this.props;
      return (
        <Container>
          <Provider store={store}>{children}</Provider>
        </Container>
      );
    }
  }

  return withRedux(createStore)(
    withReduxSaga({ async: config.async })(withStackRouter(MYApp))
  );
};
