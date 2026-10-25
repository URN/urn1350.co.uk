import React from 'react';
import Link from 'next/link';

import { SOCIALS } from './Header';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p className="site-footer__lede">
        Student radio from the University of Nottingham, <span>made by students, live every day.</span>
      </p>
      <div className="site-footer__cols">
        <div>
          <h3>Listen</h3>
          <Link href="/#listen">Listen live</Link>
          <Link href="/schedule">Schedule</Link>
          <Link href="/podcasts">Podcasts</Link>
        </div>
        <div>
          <h3>Station</h3>
          <Link href="/pages/about">About and contact</Link>
          <Link href="/pages/committee">Committee</Link>
          <Link href="/pages/get-involved">Get involved</Link>
        </div>
        <div>
          <h3>Follow</h3>
          {SOCIALS.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
          ))}
        </div>
        <div>
          <h3>Small print</h3>
          <Link href="/pages/competitions">Competition terms</Link>
          <a href="https://constitution.urn1350.co.uk/constitution.pdf">Constitution (PDF)</a>
        </div>
      </div>
      <div className="site-footer__base">
        <span>Best Student Radio Station, Student Radio Awards 2021, 2018, 2017, 2016, 2014, 2013, 2012, 2011, 2010</span>
        <span>© URN {year} · University of Nottingham Students&apos; Union</span>
      </div>
    </footer>
  );
}
