import React from 'react';
import Paper from '@mui/material/Paper';

import Settings from '../../settings.json';
import { getSpotifyPlaylistId } from '../../utils/siteSettings';

export default class Spotify extends React.Component {
  constructor(props) {
    super(props);
    this.state = { playlistId: Settings.spotifyPlaylist || '' };
  }

  componentDidMount() {
    getSpotifyPlaylistId()
      .then((playlistId) => {
        if (playlistId) this.setState({ playlistId });
      })
      .catch(() => {});
  }

  render() {
    const { playlistId } = this.state;
    if (!playlistId) return null;

    return (
      <Paper className="spotify" elevation={3}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`}
          frameBorder="0"
          allowFullScreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="URN Spotify playlist"
        />
      </Paper>
    );
  }
}
