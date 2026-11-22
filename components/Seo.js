import React from 'react';
import Head from 'next/head';

import Settings from '../settings.json';

export default function Seo({ title, description, image }) {
  const fullTitle = title ? `${title} - ${Settings.siteTitle}` : Settings.siteTitle;
  const desc = description || `${Settings.siteTitle}. ${Settings.siteSubtitle}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image ? (
        <>
          <meta property="og:image" content={image} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content={image} />
        </>
      ) : null}
    </Head>
  );
}
