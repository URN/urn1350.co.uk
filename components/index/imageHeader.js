import React from 'react';
import Axios from 'axios';

import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Settings from '../../settings.json';
import { StreamPlayerContext } from '../../context/StreamPlayerContext';
import { parseScheduleYaml } from '../../utils/schedule';

function pm(x) {
  if (x === 12) return x;
  return x - 12;
}

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default class ImageHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = { schedule: null };

    Axios.get(`${Settings.cdnUrl}/schedule.yml`).then((r) => {
      const schedule = parseScheduleYaml(r.data);
      this.setState({
        ...this.state,
        schedule,
      });
    });
  }

  getCurrentShow() {
    if (!this.state.schedule) {
      return { show_name: '', time: '' };
    }

    const d = new Date();
    const days_schedule = this.state.schedule[days[d.getDay()]] || [];

    const current_show = days_schedule.find(
      (value) => value.start <= d.getHours() && d.getHours() < value.end
    );

    if (!current_show) {
      return { show_name: '', time: '' };
    }

    const show_name = current_show.name;
    const s = current_show.start;
    const e = current_show.end;

    let time = '';
    if (e === 24) {
      time = `${pm(s)}pm-12am`;
    } else if (e >= 12) {
      if (s >= 12) {
        time = `${pm(s)}-${pm(e)}pm`;
      } else {
        time = `${s}am-${pm(e)}pm`;
      }
    } else {
      time = `${s}-${e}am`;
    }

    return { show_name, time };
  }

  render() {
    const { show_name } = this.getCurrentShow();

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
              <span className="subtitle">
                {(() => {
                  const s = Settings.siteSubtitle || '';
                  const breakBefore = 'Your Student Sound';
                  const i = s.indexOf(breakBefore);
                  if (i > 0) {
                    return (
                      <>
                        {s.slice(0, i).trimEnd()}
                        <br />
                        {s.slice(i).trimStart()}
                      </>
                    );
                  }
                  return s;
                })()}
              </span>
            </div>
          </div>
          <div className="hero-actions">
            <div className="hero-onair">
              <span className="on-air-label">
                On Air Now
                <span className="hero-mic-icon"></span>
              </span>
              <span className="hero-show-name">{show_name}</span>
            </div>
            <StreamPlayerContext.Consumer>
              {({ isPlaying, isLoading, togglePlay }) => (
                <button
                  type="button"
                  className={`listen-button ${isPlaying ? 'is-playing' : ''} ${isLoading ? 'is-loading' : ''}`}
                  onClick={togglePlay}
                  disabled={isLoading}
                >
                  <span className="listen-button-icon">
                    {isLoading ? <span className="listen-button-spinner" aria-hidden="true" /> : (isPlaying ? <Pause fontSize="inherit" /> : <PlayArrow fontSize="inherit" />)}
                  </span>
                  <span className="listen-button-label">
                    {isLoading ? 'Loading…' : (isPlaying ? 'Pause' : 'Play')}
                  </span>
                </button>
              )}
            </StreamPlayerContext.Consumer>
          </div>
        </div>
      </header>
    );
  }
}

