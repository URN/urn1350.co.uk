import React from 'react';
import Link from 'next/link';
import Header from '../../components/header';
import Footer from '../../components/footer';
import Markdown from 'markdown-to-jsx';

import Settings from '../../settings.json';
import { getWebsitePage } from '../../utils/pages';

function MdLink({ href, children, ...props }) {
  const isInternal = href && href.startsWith('/') && !href.startsWith('//');
  if (isInternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function PageName(str) {
  return str
    .replaceAll('/', ':')
    .split('-')
    .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(' ');
}

export default function Page({ data, p }) {
  const slug = p.join('/');

  // About page only: swap body background to Studio.png (same overlay as global)
  React.useEffect(() => {
    if (slug !== 'about') return;
    document.body.classList.add('page-bg-about');
    return () => document.body.classList.remove('page-bg-about');
  }, [slug]);

  if (!data) {
    return (
      <>
        <Header title={`Page Not found - ${Settings.siteTitle}`} />
        <h1 className="err">Unfortunately, the page you were looking for could not be found.</h1>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header title={`${PageName(slug)} - ${Settings.siteTitle}`} />
      <main className={`page page-${slug.replace(/\//g, '-')}`}>
        <Markdown
          options={{
            forceBlock: false,
            overrides: { a: MdLink },
          }}>
          {data}
        </Markdown>
      </main>
      <Footer />
    </>
  );
}

export async function getServerSideProps(context) {
  const p = context.query.id;
  let data = null;
  try {
    data = await getWebsitePage(p);
  } catch (err) {
    console.log(err);
  }
  return { props: { data, p } };
}
