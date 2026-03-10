import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Markdown from 'markdown-to-jsx';

import Settings from '../settings.json';

function DateString(date) {
  let d = new Date(date);
  return d.toLocaleString('en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}


export function PodcastEpisode({data, show}) {
  let img = "";
  if(data['has-image']) {
    img = `${Settings.podcastUrl}/${show}/${data.slug}.jpg`;
  }
  else {
    img = `${Settings.podcastUrl}/${show}.jpg`
  }

  return (
  <Card className="podcast-episode" key={data.slug} elevation="3" id={data.slug}>
          <CardMedia
            component="img"
            image={img}
            alt={data.name}
            />
          <CardContent>
            <Typography gutterBottom variant="h3" component="div" key="title" className="h">
              {data.name}
            </Typography>
            <span className="show-time">{DateString(data.date)}</span>
            <audio src={`${Settings.podcastUrl}/${show}/${data.slug}.mp3`} controls key="audio" />
            <Markdown options={{ forceBlock: false }} key="text">
            {data.description}
          </Markdown>
          </CardContent>
  </Card>);
}
