import React from 'react';
import Link from 'next/link';
import Axios from 'axios';
import YAML from 'yaml';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import PlusIcon from '@mui/icons-material/Add';

import PodcastCard from './podcastCard';
import Settings from '../settings.json';

export default class PodcastBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      podcasts: [],
      loading: true,
      error: null,
      cacheBust: Math.floor(Math.random() * 10000000),
    };
  }

  componentDidMount() {
    this.fetchPodcasts();
  }

  fetchPodcasts = async () => {
    try {
      const response = await Axios.get(
        `${Settings.cdnUrl}/Podcasts/podcasts.yml?cb=${this.state.cacheBust}`
      );
      const parsed = YAML.parse(response.data);
      const podcasts = Array.isArray(parsed?.podcasts) ? parsed.podcasts : [];
      podcasts.sort((a, b) => (a.order || 999) - (b.order || 999));
      this.setState({ podcasts, loading: false, error: null });
    } catch (error) {
      this.setState({
        loading: false,
        error: 'Unable to load podcasts right now.',
      });
    }
  };

  render() {
    const { podcasts, loading, error } = this.state;
    const featuredPodcasts = podcasts.filter((podcast) => podcast.featured);
    const podcastsToRender = this.props.full ? podcasts : featuredPodcasts;

    if (loading) {
      return (
        <div className="podcast-loading">
          <CircularProgress color="inherit" />
        </div>
      );
    }

    if (error) {
      return <p className="podcasts-subheading">{error}</p>;
    }

    return (
      <>
        {!this.props.full && (
          <>
            <h1 className="podcasts-heading">Podcasts</h1>
            <p className="podcasts-subheading">
              Discover our newest student podcasts.
            </p>
          </>
        )}
        <div className={`podcast-holder ${this.props.full ? 'full' : ''}`}>
          {podcastsToRender.map((podcast) => (
            <PodcastCard data={podcast} key={podcast.slug} compact={!this.props.full} />
          ))}

          {!this.props.full && (
            <Card className="podcast-card podcast-more-card">
              <CardActionArea component={Link} href="/podcasts">
                <PlusIcon className="large-icon" color="primary" />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    All Podcasts
                  </Typography>
                  <Typography noWrap>Browse every show</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          )}
        </div>
      </>
    );
  }
}
