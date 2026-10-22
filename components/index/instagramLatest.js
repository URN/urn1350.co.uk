import React from 'react';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

import { FALLBACK_POSTS, listInstagramPosts } from '../../utils/instagram';

export default class InstagramLatest extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: null };
  }

  componentDidMount() {
    listInstagramPosts()
      .then((posts) => this.setState({ posts }))
      .catch(() => this.setState({ posts: FALLBACK_POSTS }));
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
