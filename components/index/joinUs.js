import React from 'react';
import Paper from '@mui/material/Paper';

export default function JoinUs() {
  return (
    <Paper elevation={3} className="join-us">
      <div className="join-us-inner">
        <h2>Want to join us?</h2>
        <a href="/pages/get-involved" className="join-us-button">Get involved</a>
      </div>
    </Paper>
  );
}
