import React from 'react';

import Settings from '../../settings.json';

export default class ImageHeader extends React.Component {
  render() {
    return (
      <header>
        <div className="header-text blurred-container">
          <div className="hero-title">
            <img
              className="hero-logo"
              src={`${Settings.cdnUrl}/content/images/logo.png`}
              alt="University Radio Nottingham logo"
            />
            <div className="hero-text-block">
              <h1>{Settings.siteTitle}</h1>
              <span className="subtitle">{Settings.siteSubtitle}</span>
            </div>
          </div>
        </div>
      </header>
    );
  }
}