import React from 'react';
import Link from 'next/link';
import Axios from 'axios';
import YAML from 'yaml';

import Settings from '../../settings.json';

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
      const schedule = YAML.parse(r.data);
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
    const days_schedule = this.state.schedule[days[d.getDay()]];

    const current_show = Object.keys(days_schedule)
      .map((key) => [key, days_schedule[key]])
      .filter(
        ([, value]) => value.start <= d.getHours() && d.getHours() < value.end
      )[0];

    if (!current_show) {
      return { show_name: '', time: '' };
    }

    const show_name = current_show[0];
    const s = current_show[1].start;
    const e = current_show[1].end;

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
            <Link href="/schedule" className="hero-listen-link">
              <span
                className="listen-button listen-button--header"
                role="button"
              >
                <span className="listen-button-icon">›</span>
                <span className="listen-button-label">
                  View Full{' '}
                  <br className="schedule-btn-linebreak" aria-hidden="true" />
                  Schedule
                </span>
              </span>
            </Link>
          </div>
        </div>
      </header>
    );
  }
}

