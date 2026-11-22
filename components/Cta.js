import React from 'react';
import Link from 'next/link';

import Reveal from './Reveal';

/** Big closing call to action used at the foot of pages. */
export default function Cta({ heading, sub, href, label }) {
  return (
    <Reveal as="section" className="cta" aria-label={heading}>
      <h2 className="cta__text">
        {heading}{sub ? <span className="muted"> {sub}</span> : null}
      </h2>
      <Link href={href} className="btn btn--lime btn--xl">{label}</Link>
    </Reveal>
  );
}
