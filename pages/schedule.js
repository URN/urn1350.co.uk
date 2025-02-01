import Header from "../components/header";
import Footer from "../components/footer";

import Settings from '../settings.json';
import React from 'react';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Axios from 'axios';
import YAML from 'yaml';
import { Button, Card, Typography } from '@material-ui/core';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function pm(x)
{
  if(x == 12)
  return x;

  return x - 12;
}

export default function Page({schedule}) {
    const today = schedule.Monday;
  return (
    <>
      <Header
        title={`Schedule - ${Settings.siteTitle}`}
      />
      <main>
      <Typography gutterBottom variant="h1" component="div" key="title" className="h">Full Schedule</Typography>
        <div className="day-container">
        {

        days.map(day => {
            const today = schedule[day]
        return (<Paper className="day" elevation={3} key={day}>
            <h1>{day}</h1>
    {Object.keys(today).map(x => {
     let time = ""
     let s = today[x].start;
     let e = today[x].end;
       
     if ( e == 24){
       time = `${pm(s)}pm-12am`
     }
     else if(e >= 12)
     {
       if(s >= 12){
         time = `${pm(s)}-${pm(e)}pm`
       }
       else {
         time = `${s}am-${pm(e)}pm`
       }
     } else {
       time = `${s}-${e}am`
     }

    return (
    <div className={today[x].type + " show nonce-key"} key={x}>
      <span className="show-time">{time}</span>
      <span className="show-name">{x}</span>
   </div>);
   })}
   </Paper>)
})}</div>
   </main>
 <Footer/>
</>
);
}

export async function getStaticProps(context) {
    const cb = Math.floor(Math.random() * 1000);
    const data = await Axios.get(`${Settings.cdnUrl}/schedule.yml?cb=${cb}`);
    const schedule = YAML.parse(data.data);
    return {
      props: {schedule}, // will be passed to the page component as props
    }
  }
