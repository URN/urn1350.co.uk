import React from 'react';
import Link from 'next/link';

import Seo from '../components/Seo';
import PixelHeading from '../components/PixelHeading';

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" />
      <section className="lost" aria-labelledby="h1">
        <PixelHeading id="h1" size="xl">Page not found</PixelHeading>
        <p className="lede muted">Unfortunately, the page you were looking for could not be found.</p>
        <div className="actions">
          <Link href="/" className="btn btn--lime btn--lg">Listen live</Link>
          <Link href="/schedule" className="btn btn--ghost btn--lg">Schedule</Link>
        </div>
      </section>
    </>
  );
}
