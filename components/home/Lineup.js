import React, { useState } from 'react';
import Link from 'next/link';

import Reveal from '../Reveal';
import ShowBlocks from '../ShowBlocks';
import { ArrowIcon } from '../Icons';
import { useStation } from '../../context/StationContext';
import { useStreamPlayer } from '../../context/StreamPlayerContext';
import { DAY_NAMES, DAY_SHORT, decorate, weekDates } from '../../utils/schedule';

function Skeleton() {
  return (
    <div className="lineup__blocks" aria-hidden="true">
      {[0, 1].map((b) => (
        <div className="block" key={b}>
          <div className="block__head"><span className="skel" style={{ width: 90 }} /></div>
          {[0, 1, 2, 3].map((r) => (
            <div className="row row--skel" key={r}>
              <span className="skel" style={{ width: 44 }} />
              <span className="skel" style={{ width: `${55 + ((r * 13) % 30)}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Lineup() {
  const { ready, schedule, now, left } = useStation();
  const { isPlaying, play } = useStreamPlayer();
  const [picked, setPicked] = useState(null);

  const todayIdx = ready ? now.dayIndex : 0;
  const sel = picked == null ? todayIdx : picked;
  const isToday = ready && sel === todayIdx;

  const listen = () => {
    if (!isPlaying) play();
    document.getElementById('listen')?.scrollIntoView();
  };

  return (
    <section id="lineup" className="lineup" aria-labelledby="sch-h">
      <Reveal className="section-head">
        <div>
          <h2 id="sch-h" className="h-light">{ready && !isToday ? `${DAY_NAMES[sel]}'s lineup` : "Today's lineup"}</h2>
          <span className="muted">{ready ? `${DAY_NAMES[sel]} ${weekDates(now)[sel].long}` : ' '}</span>
        </div>
        <div role="group" aria-label="Choose a day" className="pills pills--scroll">
          {DAY_NAMES.map((d, i) => (
            <button key={d} type="button" className="pill" aria-pressed={ready && sel === i} onClick={() => setPicked(i)}>
              {ready && i === todayIdx ? 'Today' : DAY_SHORT[i]}
            </button>
          ))}
        </div>
      </Reveal>

      {ready ? (
        <ShowBlocks
          key={sel}
          rows={decorate(schedule[DAY_NAMES[sel]] || [], isToday, now)}
          nightFirst={isToday && now.minutes >= 20 * 60}
          left={left}
          onListen={listen}
          emptyText={`Nothing scheduled for ${DAY_NAMES[sel]}.`}
        />
      ) : (
        <Skeleton />
      )}

      <div className="lineup__foot">
        <Link href="/schedule" className="link-arrow">Full week schedule<ArrowIcon /></Link>
      </div>
    </section>
  );
}
