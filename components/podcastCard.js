import React from 'react';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import Settings from '../settings.json';
  
  export default class PodcastCard extends React.Component {
    render() {
      return (
        <Card className="podcast-card">
        <CardActionArea component={Link} href={`/podcasts/${this.props.data.slug}`}>
          <CardMedia
            component="img"
            image={this.props.data.image ? this.props.data.image : `${Settings.podcastUrl}/${this.props.data.slug}.jpg`}
            alt={this.props.data.title}
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div" noWrap className="h">
              {this.props.data.title}
            </Typography>
            <Typography noWrap>
                {this.props.data.description}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
      );
    }
}
