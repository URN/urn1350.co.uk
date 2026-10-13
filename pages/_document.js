import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

import Settings from '../settings.json';

// Runs before first paint: picks the night/purple look from the UK time (or the
// visitor's saved choice) and flags that JS is on, so there is no flash of the wrong theme.
const BOOT = `(function(){var d=document.documentElement;try{d.classList.add('js');var t=localStorage.getItem('urn-theme');if(t!=='day'&&t!=='night'){var h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'numeric',hourCycle:'h23'}).format(new Date());t=h>=8&&h<20?'day':'night'}d.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='day'?'#4a2a8b':'#1e1e1e')}catch(e){d.setAttribute('data-theme','night')}setTimeout(function(){if(!d.classList.contains('hydrated'))d.classList.remove('js')},6000)})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1e1e1e" />
        <meta name="robots" content="index,follow" />
        <meta property="fb:app_id" content="966242223397117" />
        <link rel="icon" type="image/png" href={`${Settings.cdnUrl}/content/images/icon-96.png`} sizes="96x96" />
        <link rel="icon" type="image/png" href={`${Settings.cdnUrl}/content/images/icon-64.png`} sizes="64x64" />
        <link rel="icon" type="image/png" href={`${Settings.cdnUrl}/content/images/icon-32.png`} sizes="32x32" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Doto:wght@900&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
