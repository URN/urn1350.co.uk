import React from 'react';
import Head from 'next/head';
import { Archivo, Lexend } from 'next/font/google';

import Layout from '../components/Layout';
import { StreamPlayerProvider } from '../context/StreamPlayerContext';
import { StationProvider } from '../context/StationContext';

import '../styles/globals.scss';
import '../styles/account.scss';

// Self-hosted and preloaded, so display type is ready before the heading animation starts.
// (Doto is not in next/font's list yet, so _document links it from Google Fonts.)
const lexend = Lexend({ subsets: ['latin'], weight: ['300', '400', '500', '600'], display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap' });

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-lexend:${lexend.style.fontFamily};--font-archivo:${archivo.style.fontFamily}}`,
          }}
        />
      </Head>
      <StationProvider initialSchedule={pageProps.schedule}>
        <StreamPlayerProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </StreamPlayerProvider>
      </StationProvider>
    </>
  );
}
