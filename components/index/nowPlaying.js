import React from 'react';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Button from '@material-ui/core/Button';
import Axios from 'axios';
import YAML from 'yaml';

import Settings from '../../settings.json';
  
function pm(x)
{
  if(x == 12)
  return x;

  return x - 12;
}

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  export default class ImageHeader extends React.Component {
    constructor(props) {
      super(props);
      this.state = { msg: "", schedule: null, cacheBust: null };
      this.send_message = this.send_message.bind(this);
      Axios.get(`${Settings.cdnUrl}/schedule.yml`).then(r => {
        const schedule = YAML.parse(r.data)
        this.setState({
          ...this.state,
          schedule
        })
      })
    }

    send_message = async e => {
      e.preventDefault();
    // pass form data
    // get it from state
    let that = this;
    const formData = {msg: that.state.msg};
    var x = await Axios.post("/api/message" ,formData)

    this.setState({
      ...this.state,
      msg: ""
    })
    }


    update = async event => {
  this.setState({
    ...this.state,
    msg: event.target.value
  })

}

    render() {
      let show_name = "";
      let time = "";

      if(this.state.schedule != null )
      {
        const d = new Date()
        let days_schedule = this.state.schedule[days[d.getDay()]]

        let current_show = Object.keys(days_schedule).map(
          key => 
            [key, days_schedule[key]]
        ).filter(
          ([key, value]) => value.start <= d.getHours() && d.getHours() < value.end 
        )[0];
        
        show_name = current_show[0];

        let s = current_show[1].start;
        let e = current_show[1].end;
          
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
        
      }

      if (!this.state.cacheBust) {
	this.setState({
	   ...this.state,
	   cacheBust: Math.floor(Math.random() * 10000000)
	});
      }
      
      let streamURL = `https://live.urn1350.co.uk/listen?cache=${this.state.cacheBust}`;

      return (
        
        <Paper className="now-playing" elevation={3}>
	    
            <h1>Now Playing</h1>
            <span className="show-name">{show_name}</span>
            <span className="show-time">From {time}</span>
            <br/>
            <audio src={streamURL} controls preload="none" />
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
        <Button variant="contained" color="primary" onClick={this.send_message}>Submit</Button>
        </form>
        </Paper>
      );
    }
}
