import React from 'react';
import Paper from '@material-ui/core/Paper';

export default function InstagramLatest() {
  const posts = [
    'https://www.instagram.com/p/DVUN-9LjOjy/embed',
    'https://www.instagram.com/p/DVE2WBvDC6o/embed',
    'https://www.instagram.com/p/DVg3jk_jD8n/embed',
  ];

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

