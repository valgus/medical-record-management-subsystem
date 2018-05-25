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

        {/* HERO */}
        <section id="hero-404">

          <div id="vide-video">

            <div className="columns">
              <div className="column is-half is-offset-half">

                <div className="error-text is-hidden-mobile mt-30 mb-30">
                  <h1 className="button is-xxl is-outlined league title is-white">WHAT THE ?!</h1>
                  <div className="content">
                    <p className="is-white">Well... that was awkward. The page you requested wasn't found.</p>
                    <p className="is-white">Return to the <a href="/"><strong className="is-white">Homepage.</strong></a></p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </section> {/* /#hero-404 */}

        <div className="error-text is-hidden-tablet mt-30 mb-30">
          <h1 className="button is-xxl is-outlined league title is-white">WHAT THE ?!</h1>
          <div className="content">
            <p className="is-white">Well... that was awkward. The page you requested wasn't found.</p>
            <p className="is-white">Return to the <a href="/"><strong className="is-white">Homepage.</strong></a></p>
          </div>
        </div>

      </div>
    );
  }

};
