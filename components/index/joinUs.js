import React from 'react';
import Link from 'next/link';
import Paper from '@mui/material/Paper';

export default function JoinUs() {
  return (
    <Paper elevation={3} className="join-us">
      <div className="join-us-inner">
        <h2>Want to join us?</h2>
        <Link href="/pages/get-involved" className="join-us-button">Get involved</Link>
      </div>
    </Paper>
  );
}
