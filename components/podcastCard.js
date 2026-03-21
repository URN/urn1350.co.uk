import React from 'react';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
  

export default class PodcastCard extends React.Component {
  render() {
    const { data, compact } = this.props;

    return (
      <Card className={`podcast-card ${compact ? 'compact' : ''}`}>
        <CardActionArea component={Link} href={`/podcasts/${data.slug}`}>
          <CardMedia component="img" image={data.image} alt={data.title} />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div" className="h">
              {data.title}
            </Typography>
            {!compact && data.host && (
              <Typography className="podcast-host" noWrap>
                Host: {data.host}
              </Typography>
            )}
            {!compact && data.description && (
              <Typography className="podcast-description">
                {data.description}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
}
