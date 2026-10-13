import React from 'react';
import Link from 'next/link';

import Seo from '../../components/Seo';
import Reveal from '../../components/Reveal';
import PixelHeading from '../../components/PixelHeading';
import { ArrowIcon } from '../../components/Icons';

const FACTS = [
  ['1979', 'first broadcast on University Park, November 1979'],
  ['24h', 'on air every day in term, twenty hours of it live'],
  ['150+', 'student members presenting, producing and reporting'],
  ['35k+', 'University of Nottingham students within reach'],
];

const MAKE = [
  ['Daytime entertainment', 'Music, chat and competitions through the day.'],
  ['Student news', 'News, discussion and in-depth specials made for students.'],
  ['Sport', 'Shows, podcasts and live coverage of local teams and Varsity.'],
  ['Specialist music', 'After dark shows covering almost every genre there is.'],
  ['Live events', 'Live music nights, artist interviews and outside broadcasts.'],
  ['Video', 'Video content from the studio and around campus all year.'],
];

const HOMES = [
  ['1979', 'The Cherry Tree building', 'Behind the Portland Building. Demolished in 2003.'],
  ['2003', 'Portland Building, ground floor', 'Right by mooch.'],
  ['2018', 'Media Zone, Portland Floor C', 'Our home since the Portland redevelopment.'],
];

// Years URN won Best Student Radio Station: add the new year to the end when it happens.
const BEST_STATION = ['2010', '2011', '2012', '2013', '2014', '2016', '2017', '2018', '2021'];

const CONTACTS = [
  ['Prizes and partnerships', 'Reach over 35,000 students. Provide prizes and get exposure across the Nottingham student community.', 'marketing@urn1350.co.uk'],
  ['Artists', 'Want to work with URN? Send us your music.', 'music@urn1350.co.uk'],
  ['Joining URN', 'Presenting, producing, reporting or tech.', null],
  ['Everything else', 'Any other questions for the station.', 'management@urn1350.co.uk'],
];

function ContactRow({ title, desc, email }) {
  const inner = (
    <>
      <span className="contactrow__text">
        <span className="contactrow__title">{title}</span>
        <span className="muted">{desc}</span>
      </span>
      <span className="contactrow__to">
        {email || 'Get involved'}
        <ArrowIcon size={28} className="arrow" />
      </span>
    </>
  );
  return email ? (
    <a className="contactrow" href={`mailto:${email}`}>{inner}</a>
  ) : (
    <Link className="contactrow" href="/pages/get-involved">{inner}</Link>
  );
}

export default function Page() {
  return (
    <>
      <Seo
        title="About URN"
        description="University Radio Nottingham, the multi-award-winning radio station of the University of Nottingham Students' Union, on air since November 1979."
      />

      <section className="pageintro" aria-labelledby="h1">
        <PixelHeading id="h1" size="xl">About URN</PixelHeading>
        <p className="biglede">
          On air at University Park since November 1979.{' '}
          <span className="muted">
            Multi-award-winning, completely run by students, from the Monday morning headline reader to the head of station.
          </span>
        </p>
      </section>

      <section className="facts" aria-label="URN in numbers">
        {FACTS.map(([big, small]) => (
          <Reveal className="facts__item" key={big}>
            <span className="facts__big">{big}</span>
            <span>{small}</span>
          </Reveal>
        ))}
      </section>

      <section className="band" aria-labelledby="make-h">
        <h2 id="make-h" className="band__head h-sec"><span className="muted">What</span><br />we make</h2>
        <div className="band__body band__body--grid">
          {MAKE.map(([title, desc]) => (
            <div className="make" key={title}>
              <h3 className="make__title">{title}</h3>
              <p className="make__desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="band" aria-labelledby="home-h">
        <h2 id="home-h" className="band__head h-sec"><span className="muted">Where we've</span><br />broadcast from</h2>
        <ol className="band__body homes">
          {HOMES.map(([year, place, note]) => (
            <li className="homes__item" key={year}>
              <span className="homes__year">{year}</span>
              <span className="homes__place">
                {place}
                <span className="muted">{note}</span>
              </span>
            </li>
          ))}
          <li className="homes__item homes__item--link">
            <a className="btn btn--ghost" href="https://history.urn1350.co.uk" target="_blank" rel="noopener noreferrer">
              Read more in the History Project<ArrowIcon size={16} className="arrow" />
            </a>
          </li>
        </ol>
      </section>

      <section className="band awards" aria-labelledby="awards-h">
        <div className="band__head awards__head">
          <h2 id="awards-h" className="h-light">Best Student<br />Radio Station</h2>
          <p className="muted awards__note">
            Student Radio Awards, judged by some of the most prominent figures in the radio industry, from across the BBC and
            commercial radio. URN has won more of them than any other station.
          </p>
        </div>
        <ul className="band__body awards__years" aria-label="Years we won Best Student Radio Station">
          {BEST_STATION.map((y) => (
            <li className="tnum" key={y}>{y}</li>
          ))}
        </ul>
      </section>

      <section className="contacts" aria-labelledby="contact-h">
        <h2 id="contact-h" className="h-light">Contact</h2>
        <ul className="contacts__list">
          {CONTACTS.map(([title, desc, email]) => (
            <li key={title}>
              <ContactRow title={title} desc={desc} email={email} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
