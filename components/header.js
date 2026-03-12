import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';

import Settings from '../settings.json';
import ImageHeader from './index/imageHeader';

function _Image(params) {
    if (params.image) {
      return (
        <Head>
          <meta property="og:image" content={params.image} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content={params.image} />
        </Head>
      );
    } else return <></>;
  }
  
  function _Title(params) {
    return (
      <Head>
        <title>{params.title}</title>
        <meta name="title" content={params.title} />
        <meta property="og:title" content={params.title} />
        <meta twitter="twitter:title" content={params.title} />
      </Head>
    );
  }
  
  function _Description(params) {
    if (params.description) {
      return (
        <Head>
          <meta name="description" content={params.description} />
          <meta property="og:description" content={params.description} />
          <meta name="twitter:description" content={params.description} />
        </Head>
      );
    } else return <></>;
  }
  
export default class Header extends React.Component {
  render() {
    return (
      <>
        <_Title title={this.props.title} />
        <_Image image={this.props.image} />
        <_Description description={this.props.description} />
        <Head>
          <link
            rel="icon"
            type="image/png"
            href={`${Settings.cdnUrl}/content/images/icon-96.png`}
            sizes="96x96"
          />
          <link
            rel="icon"
            type="image/png"
            href={`${Settings.cdnUrl}/content/images/icon-64.png`}
            sizes="64x64"
          />
          <link
            rel="icon"
            type="image/png"
            href={`${Settings.cdnUrl}/content/images/icon-32.png`}
            sizes="32x32"
          />
          <meta property="fb:app_id" content="966242223397117" />
          <meta charSet="utf-8" />
          <meta name="robots" content="index,follow" />
        </Head>
        <div className="site-header-sticky">
          <ImageHeader />
          <Box>
            <AppBar color="secondary" position="sticky" component="nav">
            <Toolbar>
              <Button component={Link} href="/">Home</Button>
              <Button component={Link} href="/podcasts">Podcasts</Button>
              <Button component={Link} href="/pages/about">About Us</Button>
              <Button component={Link} href="/pages/committee">Committee</Button>
            </Toolbar>
          </AppBar>
          </Box>
        </div>
      </>
    );
  }
}
