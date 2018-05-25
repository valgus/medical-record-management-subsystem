import React, { Component, PropTypes } from 'react';
import $ from 'jquery';

export default class NotFound extends React.Component {

  render() {

    const css = `
      body { margin-top: 0; }
      body { background: #22272E; }
      footer.footer { margin-top: 0; }
      html { background: none; } /* html background breaks vide.js */
    `

    return (
      <div id="not-found-page">

        <style>{css}</style>

        <h1>Not Found</h1>

      </div>
    );
  }

};
