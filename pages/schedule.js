import React, { useState } from 'react';
import Link from 'next/link';

import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import PixelHeading from '../components/PixelHeading';
import { PlayIcon } from '../components/Icons';
import ShowBlocks from '../components/ShowBlocks';
import { useStation } from '../context/StationContext';
import { fetchSchedule } from '../lib/content';
import {
  DAY_NAMES,
  DAY_SHORT,
  decorate,
  weekDates,
  formatMinutes,
  formatRange,
} from '../utils/schedule';

const FILTERS = [
  ['all', 'Everything'],
  ['day', 'Daytime'],
  ['night', 'After dark'],
  ['sport', 'Sport and news'],
];

function Cell({ rows, label, night }) {
  return (
    <div className={`wk__cell ${night ? 'wk__cell--night' : 'wk__cell--day'}`}>
      <span className="caps wk__label">{label}</span>
      {rows.length === 0 ? <span className="wk__none small">Nothing scheduled</span> : null}
      <ul>
        {rows.map((r) => (
          <li key={r.id} className={`wk__row row--${r.state}`} aria-current={r.state === 'now' ? 'time' : undefined}>
            <span className="wk__time tnum">{formatMinutes(r.startMin)}–{formatMinutes(r.endMin)}</span>
            <span className="wk__title">{r.name}</span>
            {r.tag ? <span className={`tag tag--${r.tag.toLowerCase()}`}>{r.tag}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Page({ schedule: staticSchedule }) {
  const { ready, schedule: live, now, show } = useStation();
  const schedule = live || staticSchedule;
  const [filter, setFilter] = useState('all');
  const [picked, setPicked] = useState(null);

  const todayIdx = ready ? now.dayIndex : -1;
  const sel = picked == null ? Math.max(todayIdx, 0) : picked;
  const dates = ready ? weekDates(now) : null;

  const days = DAY_NAMES.map((name, i) => {
    const isToday = i === todayIdx;
    const rows = decorate((schedule && schedule[name]) || [], isToday, now || { minutes: 0 }).filter(
      (r) => filter !== 'sport' || r.tag
    );
    return {
      name,
      isToday,
      day: filter === 'night' ? [] : rows.filter((r) => !r.night),
      night: filter === 'day' ? [] : rows.filter((r) => r.night),
    };
  });

  const selDay = days[sel];

  return (
    <>
      <Seo title="Schedule" />

      <section className="pagehead" aria-labelledby="h1">
        <div className="pagehead__row">
          <div className="pagehead__title">
            <PixelHeading id="h1" size="xl">Schedule</PixelHeading>
          </div>
          <div role="group" aria-label="Show" className="pills">
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" className="pill" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {ready && show ? (
          <Link href="/#listen" className="livebar">
            <span className="livebar__title">{show.name}</span>
            <span className="tnum">{formatRange(show)}</span>
            <span className="btn btn--ink livebar__cta"><PlayIcon size={12} />Listen and message</span>
          </Link>
        ) : null}
      </section>

      {!schedule ? (
        <p className="empty">Unable to load the schedule.</p>
      ) : (
        <>
          <Reveal className="wk" aria-label="Weekly schedule">
            {days.map((d, i) => (
              <div className={`wk__head ${d.isToday ? 'is-today' : ''}`} key={`h-${d.name}`}>
                <span>{d.name}</span>
                <span className="small">{d.isToday ? 'Today' : ready ? dates[i].short : ''}</span>
              </div>
            ))}
            {filter !== 'night' ? days.map((d) => <Cell key={`d-${d.name}`} rows={d.day} label="Daytime" night={false} />) : null}
            {filter !== 'day' ? days.map((d) => <Cell key={`n-${d.name}`} rows={d.night} label="After dark" night />) : null}
          </Reveal>

          <div className="wkm">
            <div role="group" aria-label="Choose a day" className="pills pills--scroll">
              {days.map((d, i) => (
                <button
                  key={d.name}
                  type="button"
                  className="pill"
                  aria-pressed={sel === i}
                  onClick={() => setPicked(i)}
                >
                  {d.isToday ? 'Today' : DAY_SHORT[i]}
                </button>
              ))}
            </div>
            <ShowBlocks
              key={`${sel}-${filter}`}
              rows={[...selDay.day, ...selDay.night]}
              emptyText={`Nothing scheduled for ${DAY_NAMES[sel]}.`}
            />
          </div>
        </>
      )}
    </>
  );
}

export async function getStaticProps() {
  return { props: { schedule: await fetchSchedule() }, revalidate: 60 };
}
