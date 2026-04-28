import Header from "../components/header";
import Footer from "../components/footer";

import Settings from '../settings.json';
import React from 'react';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Axios from 'axios';
import { Typography } from '@mui/material';
import { parseScheduleYaml } from '../utils/schedule';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function pm(x)
{
  if(x == 12)
  return x;

  return x - 12;
}

export default function Page({schedule}) {
  React.useEffect(() => {
    document.body.classList.add('page-bg-schedule');
    return () => document.body.classList.remove('page-bg-schedule');
  }, []);

  const d = new Date();
  const currentDayIndex = (d.getDay() + 6) % 7; // Monday=0, Sunday=6
  const currentHour = d.getHours();

  return (
    <>
      <Header
        title={`Schedule - ${Settings.siteTitle}`}
      />
      <main className="schedule-page">
        <Typography gutterBottom variant="h1" component="div" key="title" className="h">Full Schedule</Typography>
        <div className="day-container">
          {days.map((day, dayIndex) => {
            const daySchedule = schedule[day];
            const isCurrentDay = dayIndex === currentDayIndex;

            return (
              <Paper className="schedule schedule-day" elevation={3} key={day}>
                <h1 className="schedule-title">{day}</h1>
                <div className="schedule-list schedule-list--no-scroll">
                  {(daySchedule || [])
                    .filter((show) => show.type !== "automation" && show.name)
                    .map((show) => {
                      let time = "";
                      const s = show.start;
                      const e = show.end;

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

                      const isLive = isCurrentDay && s <= currentHour && currentHour < e;

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
              </Paper>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

export async function getStaticProps(context) {
    const cb = Math.floor(Math.random() * 1000);
    const data = await Axios.get(`${Settings.cdnUrl}/schedule.yml?cb=${cb}`);
    const schedule = parseScheduleYaml(data.data);
    return {
      props: {schedule}, // will be passed to the page component as props
      revalidate: 60,
    }
  }
