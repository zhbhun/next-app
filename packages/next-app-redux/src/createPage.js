import { connect } from 'react-redux';
import React, { PureComponent } from 'react';

export default ({
  title,
  models,
  getInitialProps,
  mapStateToProps,
  mapDispatchToProps,
}) => Page => {
  const ConnectedPage = connect(
    mapStateToProps,
    mapDispatchToProps
  )(Page);
  class WrappedPage extends PureComponent {
    static displayName = `createPage(${Page.displayName ||
      Page.name ||
      'Page'})`;

    static models = models;

    static getInitialProps = getInitialProps;

    render() {
      return <ConnectedPage {...this.props} />;
    }
  }
  return WrappedPage;
};
