import React from 'react';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Axios from 'axios';
import YAML from 'yaml';

import Settings from '../../settings.json';

// Fallback if CDN fetch fails or YAML has no posts
const FALLBACK_POSTS = [
  'https://www.instagram.com/p/DVUN-9LjOjy/embed',
  'https://www.instagram.com/p/DVE2WBvDC6o/embed',
  'https://www.instagram.com/p/DVg3jk_jD8n/embed',
];

function normalizePosts(data) {
  if (!data || !Array.isArray(data.posts)) return null;
  const urls = data.posts
    .map((item) => (typeof item === 'string' ? item : item && item.url))
    .filter(Boolean);
  return urls.length > 0 ? urls.slice(0, 3) : null;
}

export default class InstagramLatest extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: null, rand: Math.floor(Math.random() * 1000) };
    Axios.get(`${Settings.cdnUrl}/instagram_links.yml?cb=${this.state.rand}`)
      .then((r) => {
        const parsed = YAML.parse(r.data);
        const posts = normalizePosts(parsed) || FALLBACK_POSTS;
        this.setState({ posts });
      })
      .catch(() => {
        this.setState({ posts: FALLBACK_POSTS });
      });
  }

  render() {
    const posts = this.state.posts || FALLBACK_POSTS;

    if (this.state.posts === null) {
      return (
        <section className="instagram-latest">
          <h2>Latest at URN</h2>
          <div className="instagram-latest-feed">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CircularProgress color="inherit" />
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="instagram-latest">
        <h2>Latest at URN</h2>
        <div className="instagram-latest-feed">
          <div className="instagram-feed-scroll">
            {posts.map((url, index) => (
              <Paper elevation={3} className="instagram-card" key={url || index}>
                <div className="instagram-embed-wrapper">
                  <iframe
                    src={url}
                    title={`URN1350 Instagram post ${index + 1}`}
                    frameBorder="0"
                    scrolling="no"
                    allow="encrypted-media"
                  />
                </div>
              </Paper>
            ))}
          </div>
        </div>
      </section>
    );
  }
}
