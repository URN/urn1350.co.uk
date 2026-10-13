import React from 'react';

/**
 * The extruded pixel display heading. Each character rises into place with an
 * elastic ease, staggered left to right (the radioradio.radio intro), then the
 * hard offset extrude settles underneath. `play` holds the letters back until
 * the content they spell is ready.
 */
export default function PixelHeading({ as: Tag = 'h1', size = 'xl', play = true, className = '', id, children }) {
  const text = String(children);
  const words = text.split(' ');
  let index = 0;
  // Long show names step the size down so they never overflow the column.
  const len = text.length;
  const fit = len <= 14 ? 1 : len <= 22 ? 0.8 : len <= 32 ? 0.64 : 0.52;

  return (
    <Tag
      key={text}
      id={id}
      className={`pixel pixel--${size} ${play ? 'is-in' : ''} ${className}`}
      style={{ '--fit': fit }}
      aria-label={text}
    >
      {words.map((word, w) => (
        <React.Fragment key={`${word}-${w}`}>
          <span className="pixel__word" aria-hidden="true">
            {Array.from(word).map((ch, c) => {
              const i = index;
              index += 1;
              return (
                <span className="pixel__ch" style={{ '--i': i }} key={`${ch}-${c}`}>
                  {ch}
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}
