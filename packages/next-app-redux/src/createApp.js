import React from 'react';
import App, { Container } from 'next/app';
import { Provider } from 'react-redux';
import withRedux from './withRedux';
import withReduxSaga from './withReduxSaga';
import withStackRouter from './withStackRouter';

export default createStore => {
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
    withReduxSaga({ async: false })(withStackRouter(MYApp))
  );
};
