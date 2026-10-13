import React, { useState } from 'react';

import Seo from '../../components/Seo';
import Cta from '../../components/Cta';
import Reveal from '../../components/Reveal';
import PixelHeading from '../../components/PixelHeading';
import { fetchCdn } from '../../lib/content';
import fallback from '../../lib/committee.json';

const CURRENT_LABEL = '2026–27';

/** "- Head of Station: **Name**" lines from the CDN page, or null if it can't be read. */
function parseCurrent(md) {
  const heading = /^##\s*(\d{4})\s*[-–]\s*(\d{2})(\d{2})?/m.exec(md);
  const rows = [...md.matchAll(/^\s*[-*+]\s+(.+?):\s*\*\*(.+?)\*\*\s*$/gm)].map((m) => [m[1].trim(), m[2].trim()]);
  if (!heading || rows.length === 0) return null;
  return { label: `${heading[1]}–${heading[3] || heading[2]}`, rows };
}

export default function Page({ current }) {
  const years = [current.label, ...Object.keys(fallback.archive)];
  const [year, setYear] = useState(current.label);
  const isNow = year === current.label;
  const roles = isNow ? current.rows : fallback.archive[year];

  return (
    <>
      <Seo title="Committee" description={`The students who run URN, ${current.label} and every committee since 2012.`} />

      <section className="pagehead" aria-labelledby="h1">
        <div className="pagehead__row">
          <div className="pagehead__title pagehead__title--row">
            <PixelHeading id="h1" size="xl">Committee</PixelHeading>
            <span className="yearchip tnum">{year}</span>
          </div>
        </div>
        <div role="group" aria-label="Year" className="pills pills--scroll">
          {years.map((y) => (
            <button key={y} type="button" className="pill tnum" aria-pressed={y === year} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </section>

      <ul className="roster">
        {roles.map(([role, name], i) => (
          <Reveal as="li" className={`roster__item ${i === 0 ? 'roster__item--lead' : ''}`} delay={Math.min(i, 5) * 40} key={`${year}-${role}-${name}`}>
            <span className="roster__role">{role}</span>
            <span className="roster__name">{name}</span>
          </Reveal>
        ))}
      </ul>

      <Cta heading="Want to talk to a team?" sub="Every head has their own inbox." href="/pages/get-involved" label="Team contacts" />
    </>
  );
}

export async function getStaticProps() {
  let current = { label: CURRENT_LABEL, rows: fallback.current };
  try {
    current = parseCurrent(await fetchCdn('website/committee')) || current;
  } catch (e) {
    // keep the bundled list
  }
  return { props: { current }, revalidate: 60 };
}
