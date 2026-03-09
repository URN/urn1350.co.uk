import React from 'react';
import Paper from '@material-ui/core/Paper';

import Settings from '../../settings.json';

export default class Spotify extends React.Component {
  render() {
    return <Paper className="spotify" elevation={3}>
      <iframe src={`https://open.spotify.com/embed/playlist/${Settings.spotifyPlaylist}?utm_source=generator`}
        frameBorder="0"
        allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">
      </iframe>
    </Paper>;
  }
}
