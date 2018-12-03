import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';

/**
 * @param {Object} props
 * @param {Object} props.metas
 * @param {Array} props.scripts
 */
export default props => {
  class MYDocument extends Document {
    static async getInitialProps(ctx) {
      const initialProps = await Document.getInitialProps(ctx);
      return { ...initialProps };
    }

    render() {
      return (
        <html>
          <Head>{props.metas || null}</Head>
          <body>
            <Main />
            <NextScript />
          </body>
        </html>
      );
    }
  }
  return MYDocument;
};
