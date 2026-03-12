import React from 'react';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
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
    this.state = { msg: '', schedule: null, cacheBust: null, isPlaying: false };
    this.audioRef = React.createRef();
    this.send_message = this.send_message.bind(this);

    Axios.get(`${Settings.cdnUrl}/schedule.yml`).then((r) => {
      const schedule = YAML.parse(r.data);
      this.setState({
        ...this.state,
        schedule,
      });
    });
  }

  send_message = async (e) => {
    e.preventDefault();
    const formData = { msg: this.state.msg };
    await Axios.post('/api/message', formData);

    this.setState({
      ...this.state,
      msg: '',
    });
  };

  update = async (event) => {
    this.setState({
      ...this.state,
      msg: event.target.value,
    });
  };

  togglePlay = () => {
    const audio = this.audioRef.current;
    if (!audio) return;

    if (this.state.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    this.setState({
      ...this.state,
      isPlaying: !this.state.isPlaying,
    });
  };

  render() {
    let show_name = '';
    let time = '';

    if (this.state.schedule != null) {
      const d = new Date();
      const days_schedule = this.state.schedule[days[d.getDay()]];

      const current_show = Object.keys(days_schedule)
        .map((key) => [key, days_schedule[key]])
        .filter(
          ([, value]) =>
            value.start <= d.getHours() && d.getHours() < value.end
        )[0];

      if (!current_show) {
        show_name = '';
        time = '';
      } else {
      show_name = current_show[0];

      const s = current_show[1].start;
      const e = current_show[1].end;

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
      }
    }

    if (!this.state.cacheBust) {
      this.setState({
        ...this.state,
        cacheBust: Math.floor(Math.random() * 10000000),
      });
    }

    const streamURL = `https://live.urn1350.co.uk/listen?cache=${this.state.cacheBust}`;

    return (
      <div className="now-playing">
        <Paper className="now-playing-top-box" elevation={3}>
          <div className="now-playing-header">
            <div className="now-playing-meta">
              <span className="on-air-label">On Air Now</span>
              <div>
                <span className="show-name">{show_name}</span>
              </div>
              <span className="show-time">From {time}</span>
            </div>
            <button
              type="button"
              className={`listen-button ${
                this.state.isPlaying ? 'is-playing' : ''
              }`}
              onClick={this.togglePlay}
            >
              <span className="listen-button-icon">
                {this.state.isPlaying ? '❚❚' : '▶'}
              </span>
              <span className="listen-button-label">
                {this.state.isPlaying ? 'Pause' : 'Play'}
              </span>
            </button>
          </div>
          <audio
            ref={this.audioRef}
            src={streamURL}
            preload="none"
            className="now-playing-audio"
          />
        </Paper>
        <Paper className="now-playing-message-box" elevation={3}>
          <form onSubmit={this.handleOnSubmit}>
            <TextField
              className="message-show"
              label="Message The Show"
              multiline
              minRows={4}
              variant="standard"
              value={this.state.msg}
              onChange={this.update}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={this.send_message}
            >
              Submit
            </Button>
          </form>
        </Paper>
      </div>
    );
  }
}
