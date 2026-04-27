import React from 'react';
import Link from 'next/link';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Axios from 'axios';

import Settings from '../../settings.json';
import { Button, Card } from '@mui/material';
import { parseScheduleYaml } from '../../utils/schedule';

function pm(x)
{
  if(x == 12)
  return x;

  return x - 12;
}

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  export default class Schedule extends React.Component {
    constructor(props) {
      super(props);
      this.state = {schedule: null, rand: Math.floor(Math.random() * 1000)};
      Axios.get(`${Settings.cdnUrl}/schedule.yml?cb=${this.state.rand}`).then(r => {
        const schedule = parseScheduleYaml(r.data)
        this.setState({
          ...this.state,
          schedule
        })
      })
    }

    render() {
      if(this.state.schedule == null){
      return (
        <Paper className="schedule" elevation={3}>
          <h1 className="schedule-title">Today's Schedule</h1>
          <CircularProgress color="primary" />
          <Button className="schedule-cta" color="primary" component={Link} href="/schedule">View Full Schedule</Button>
        </Paper>
      );
    }
  else {
    const d = new Date();
    const currentHour = d.getHours();
    let today = this.state.schedule[days[d.getDay()]] || [];

    return (
    <Paper className="schedule" elevation={3}>
      <h1 className="schedule-title">Today's Schedule</h1>
      <div className="schedule-list">
        {today
          .filter((show) => show.type !== "automation" && show.name)
          .map((show) => {
            let time = "";
            let s = show.start;
            let e = show.end;
            const isLive = s <= currentHour && currentHour < e;

            if (e == 24) {
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

            return (
              <div
                key={show.id}
                className={show.type + " show" + (isLive ? " is-live" : "")}
              >
                <span className="show-time">{time}</span>
                <span className="show-name">{show.name}</span>
              </div>
            );
          })}
      </div>
      <Button className="schedule-cta" variant="contained" color="primary" component={Link} href="/schedule">
        View Full Schedule
      </Button>
    </Paper>);
  }

  
}
}
