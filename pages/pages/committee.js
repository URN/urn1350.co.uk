import React, { useState } from 'react';

import Seo from '../../components/Seo';
import Cta from '../../components/Cta';
import Reveal from '../../components/Reveal';
import PixelHeading from '../../components/PixelHeading';
import { ArrowIcon } from '../../components/Icons';
import committees from '../../lib/committee.json';

// lib/committee.json is newest first: a new year is one new entry at the top.
const years = committees.map((c) => c.label);
const current = years[0];
const oldest = years[years.length - 1].slice(0, 4);

export default function Page() {
  const [year, setYear] = useState(current);
  const roles = committees.find((c) => c.label === year).rows;

  return (
    <>
      <Seo title="Committee" description={`The students who run URN, ${current} and every committee since ${oldest}.`} />

      <section className="pagehead" aria-labelledby="h1">
        <div className="pagehead__row">
          <div className="pagehead__title pagehead__title--row">
            <PixelHeading id="h1" size="xl">Committee</PixelHeading>
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

      <Reveal as="section" className="archive" aria-labelledby="history-h">
        <div className="archive__text">
          <h2 id="history-h" className="archive__title">Looking for older years?</h2>
          <p className="muted">Committees from before {oldest} are in the University Radio Nottingham History Project.</p>
        </div>
        <a className="btn btn--ghost btn--xl" href="https://history.urn1350.co.uk/years/" target="_blank" rel="noopener noreferrer">
          Browse the history<ArrowIcon className="arrow" />
        </a>
      </Reveal>

      <Cta heading="Want to talk to a team?" sub="Every head has their own inbox." href="/pages/get-involved" label="Team contacts" />
    </>
  );
}
