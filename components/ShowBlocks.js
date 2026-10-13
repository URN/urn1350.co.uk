import React, { useState } from 'react';

import { PlayIcon } from './Icons';
import { formatMinutes, formatLeft } from '../utils/schedule';

const LABELS = { day: 'Daytime', night: 'After dark' };

/**
 * One day's shows split into Daytime and After dark blocks, with earlier shows
 * collapsed behind a toggle. Give it a `key` that changes with the day so the
 * toggle resets. Pass `onListen` to show a Listen button on the live row.
 */
export default function ShowBlocks({ rows, nightFirst = false, left, onListen, emptyText }) {
  const [pastOpen, setPastOpen] = useState(false);
  const order = nightFirst ? ['night', 'day'] : ['day', 'night'];
  const blocks = order
    .map((id) => ({ id, rows: rows.filter((r) => r.night === (id === 'night')) }))
    .filter((b) => b.rows.length > 0);

  return (
    <div className={`lineup__blocks ${blocks.length === 1 ? 'is-single' : ''}`}>
      {blocks.length === 0 ? <p className="empty">{emptyText}</p> : null}
      {blocks.map(({ id, rows: all }) => {
        const past = all.filter((r) => r.state === 'past');
        return (
          <div className={`block block--${id}`} key={id}>
            <div className="block__head">
              <span className="caps">{LABELS[id]}</span>
            </div>
            {past.length > 0 ? (
              <button type="button" className="block__past" aria-expanded={pastOpen} onClick={() => setPastOpen((o) => !o)}>
                {past.length} {past.length === 1 ? 'show' : 'shows'} finished earlier
                <span>{pastOpen ? 'Hide' : 'Show'}</span>
              </button>
            ) : null}
            <ul>
              {(pastOpen ? all : all.filter((r) => r.state !== 'past')).map((r, i) => {
                const isNow = r.state === 'now';
                return (
                  <li key={r.id} className={`row row--${r.state}`} aria-current={isNow ? 'time' : undefined} style={{ '--i': i }}>
                    <span className="row__time tnum">{formatMinutes(r.startMin)}</span>
                    <span className="row__main">
                      <span className="row__title">{r.name}</span>
                      <span className="row__sub small">
                        {isNow ? (
                          <>
                            <span>On air now</span>
                            {left != null ? <span>{formatLeft(left, r.endMin)}</span> : null}
                          </>
                        ) : r.state === 'past' ? 'Finished' : `until ${formatMinutes(r.endMin)}`}
                      </span>
                    </span>
                    <span className="row__end">
                      {r.tag && !isNow ? <span className={`tag tag--${r.tag.toLowerCase()}`}>{r.tag}</span> : null}
                      {isNow && onListen ? (
                        <button type="button" className="btn btn--sm btn--ink" onClick={onListen}>
                          <PlayIcon size={13} />Listen
                        </button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
