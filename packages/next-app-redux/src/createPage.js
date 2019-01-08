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

    componentWillUnmount() {
      this.props.store.unmodel(
        Object.keys(this.props.models).map(key => this.props.models[key])
      );
    }

    render() {
      return <ConnectedPage {...this.props} />;
    }
  }
  return WrappedPage;
};
