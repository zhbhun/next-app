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
      this.destroyModels();
    }

    destroyModels() {
      // TODO _app 热加载时会重建 App 组件，销毁当前页面组件且卸载对应 models，导致新的路由页面组件的 models 不存在
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
