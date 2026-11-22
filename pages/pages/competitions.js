import React from 'react';

import Seo from '../../components/Seo';
import PixelHeading from '../../components/PixelHeading';
import { GENERAL, SPECIFIC, CONTACT } from '../../lib/competitions';

const SECTIONS = [{ id: 'general', ...GENERAL }, ...SPECIFIC];
const pad = (n) => String(n).padStart(2, '0');

export default function Page() {
  return (
    <>
      <Seo title="Competition terms" description="The rules for every competition on URN, on air or online, plus extra rules for specific competitions." />

      <section className="pagehead pagehead--split" aria-labelledby="h1">
        <PixelHeading id="h1" size="xl">Competition terms</PixelHeading>
        <p className="pagehead__aside muted">
          The rules for every competition on URN, on air or online, plus extra rules for specific competitions.
        </p>
      </section>

      <div className="terms">
        <nav className="terms__nav" aria-label="On this page">
          <div className="terms__navin">
            <span className="caps caps--muted">On this page</span>
            {SECTIONS.map((s, i) => (
              <a href={`#${s.id}`} key={s.id}>
                {s.title}
                <span className="tnum terms__num">{pad(i + 1)}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="terms__body">
          {SECTIONS.map((s, i) => (
            <section id={s.id} className="terms__sec" aria-labelledby={`${s.id}-h`} key={s.id}>
              <div className="terms__title">
                <span className="tnum terms__num">{pad(i + 1)}</span>
                <h2 id={`${s.id}-h`}>{s.title}</h2>
              </div>
              {s.intro ? <p className="muted terms__intro">{s.intro}</p> : null}
              <ol className="terms__rules">
                {s.rules.map((r, j) => (
                  <li key={r}>
                    <span className="tnum muted">{pad(j + 1)}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <div className="terms__contact">
            <span>Information, questions and complaints about competitions go to the Head of Finance.</span>
            <a className="btn btn--lime" href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </div>
        </div>
      </div>
    </>
  );
}
