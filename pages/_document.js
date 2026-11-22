import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';


// Runs before first paint: flags that JS is on, so the reveal animations don't flash.
const BOOT = `(function(){var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.classList.contains('hydrated'))d.classList.remove('js')},6000)})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#7b54bf" />
        <meta name="robots" content="index,follow" />
        <meta property="fb:app_id" content="966242223397117" />
        <link rel="icon" type="image/png" href={`/content/images/icon-96.png`} sizes="96x96" />
        <link rel="icon" type="image/png" href={`/content/images/icon-64.png`} sizes="64x64" />
        <link rel="icon" type="image/png" href={`/content/images/icon-32.png`} sizes="32x32" />
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
