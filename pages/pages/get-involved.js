import React from 'react';

import Seo from '../../components/Seo';
import Reveal from '../../components/Reveal';
import PixelHeading from '../../components/PixelHeading';
import { ArrowIcon } from '../../components/Icons';
import committees from '../../lib/committee.json';

const NEW_MEMBERS = 'https://www.facebook.com/groups/9040436162640250';
const FACEBOOK = 'https://www.facebook.com/urn1350';

// `head` is matched against the committee roles, so the "Talk to" name follows the
// committee page and never needs editing when a new year starts.
const TEAMS = [
  {
    name: 'Daytime',
    meta: '09:00–17:00 every day in term',
    head: 'daytime',
    email: 'daytime@urn1350.co.uk',
    desc: 'Entertainment, chat, music and competitions. Think Scott Mills, Clara Amfo and Greg James. The best place to express your creativity.',
  },
  {
    name: 'After Dark',
    meta: '19:00–03:00',
    head: 'specialist',
    email: 'afterdark@urn1350.co.uk',
    desc: 'The best of specialist music, from rock to rap. If you have a passion for a particular genre, this is for you.',
  },
  {
    name: 'Culture',
    meta: 'Speech and podcasts',
    head: 'cultur',
    email: 'speech@urn1350.co.uk',
    desc: 'A huge array of shows, from film and lifestyle to award winning podcasts.',
  },
  {
    name: 'News',
    meta: 'The Pulse, 17:00 weekdays',
    head: 'news',
    email: 'news@urn1350.co.uk',
    desc: "An hour long news show covering the top stories of the day in more detail, plus in depth specials and coverage of the Students' Union elections. Valuable experience in broadcast journalism.",
  },
  {
    name: 'Sport',
    meta: 'Saturdays and Varsity',
    head: 'sport',
    email: 'sport@urn1350.co.uk',
    desc: 'A Saturday football show and a huge number of podcasts covering all different areas of sport. Exclusive live coverage of the Varsity series in the new year, broadcasting from iconic venues, and press passes for Notts County FC fixtures.',
  },
  {
    name: 'Technical',
    meta: 'Studios, servers and website',
    head: 'technolog',
    email: 'technical@urn1350.co.uk',
    desc: "Everything from microphones, servers and cables to website design. Two digital radio studios, a live room and numerous outside broadcasts. Whether you're experienced or have absolutely no experience, we would love to hear from you.",
  },
];

const ROWS = committees[0].rows;
const TEAMS_WITH_HEADS = TEAMS.map(({ head, ...t }) => {
  const row = ROWS.find(([role]) => role.toLowerCase().includes(head));
  return { ...t, who: row ? row[1].split(' ')[0] : '' };
});

export default function Page() {
  return (
    <>
      <Seo
        title="Get involved"
        description="Present, produce or report. You'll get all the training you need to make it on air."
      />

      <section className="pageintro" aria-labelledby="h1">
        <PixelHeading id="h1" size="xl">Get involved</PixelHeading>
        <div className="pageintro__row">
          <p className="herolede">
            Present, produce or report. You'll get all the training you need to make it on air.{' '}
            <span className="muted">Many of us had never done radio before we joined.</span>
          </p>
          <div className="pageintro__actions">
            <a className="btn btn--lime btn--xl" href={NEW_MEMBERS} target="_blank" rel="noopener noreferrer">
              Join the new members group
            </a>
            <a className="btn btn--ghost btn--xl" href="#teams">Find your team</a>
          </div>
        </div>
      </section>

      <section id="teams" className="teamlist" aria-labelledby="teams-h">
        <div className="teamlist__head">
          <h2 id="teams-h" className="h-light">Pick a team</h2>
          <p className="muted">Each team is run by someone on committee. Email them directly, they'll get you started.</p>
        </div>
        <ul className="teamlist__rows">
          {TEAMS_WITH_HEADS.map((t, i) => (
            <Reveal as="li" className="teamrow" delay={Math.min(i, 5) * 50} key={t.name}>
              <div className="teamrow__title">
                <h3 className="teamrow__name">{t.name}</h3>
                <span className="caps caps--butter">{t.meta}</span>
              </div>
              <p className="teamrow__desc">{t.desc}</p>
              <div className="teamrow__contact">
                {t.who ? <span className="muted">Talk to {t.who}</span> : null}
                <a className="btn btn--ghost" href={`mailto:${t.email}`}>
                  {t.email}<ArrowIcon size={16} className="arrow" />
                </a>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <Reveal as="section" className="callout" aria-labelledby="unsure-h">
        <div className="callout__text">
          <h2 id="unsure-h" className="callout__title">Not sure where you fit?</h2>
          <p>
            None of these seem right? Drop us an email and we'll point you to the right people. You can also message{' '}
            <a href={FACEBOOK} target="_blank" rel="noopener noreferrer">us on Facebook</a>. General questions go to{' '}
            <a href="mailto:management@urn1350.co.uk">management@urn1350.co.uk</a>.
          </p>
        </div>
        <a className="btn btn--lime btn--xl" href="mailto:getinvolved@urn1350.co.uk">getinvolved@urn1350.co.uk</a>
      </Reveal>
    </>
  );
}
