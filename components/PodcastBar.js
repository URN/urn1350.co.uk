import React from 'react';
import Axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';

import PlusIcon from '@mui/icons-material/Add'

import PodcastCard from './podcastCard'
import Settings from '../settings.json';

import podcastInfo from "../public/podcasts.json";



export default class PodcastBar extends React.Component {
    constructor(props){
        super(props);
        this.state = {};
    }
    render() {
      const allPodcasts = Object.keys(podcastInfo);
      const featuredPodcasts = allPodcasts.filter(key => podcastInfo[key].featured === "yes");

      //Decides to render all or only featured podcasts based on "full" value
      const podcastsToRender = this.props.full ? allPodcasts : featuredPodcasts;

            return (
                <>
                {
                  (this.props.full ? (
                    <></>
                  ) : (
                    <>
                      <h1 className="podcasts-heading">Podcasts</h1>
                      <p className="podcasts-subheading">
                        New podcasts coming to the website soon!
                      </p>
                    </>
                  ))
                }
                  <div className={`podcast-holder ${this.props.full?"full":""}`}>
                  {
                    (podcastsToRender.map(x => <PodcastCard data={podcastInfo[x]} key={x}/>))
                  }
                  
                  {this.props.full?<></>:<Card className="podcast-card">
        <CardActionArea href="podcasts">
        <PlusIcon className="large-icon" color="primary" />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div">
              More Podcasts
            </Typography>
            <Typography noWrap>
                View all our podcasts
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>}
      </div> </>);
    }
}
