import React from 'react';
import Link from 'next/link';
import Markdown from 'markdown-to-jsx';

import Seo from '../../components/Seo';
import PixelHeading from '../../components/PixelHeading';
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

function pageName(slug) {
  return slug
    .replaceAll('/', ': ')
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

/** Any /pages/<slug> without its own designed page: Markdown edited under Account > Manage website. */
export default function Page({ data, p }) {
  const slug = p.join('/');

  if (!data) {
    return (
      <>
        <Seo title="Page not found" />
        <section className="pagehead" aria-labelledby="h1">
          <div className="pagehead__row">
            <div className="pagehead__title">
              <PixelHeading id="h1" size="xl">Not found</PixelHeading>
            </div>
          </div>
        </section>
        <div className="prose">
          <p>Unfortunately, the page you were looking for could not be found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={pageName(slug)} />
      <section className="pagehead" aria-labelledby="h1">
        <div className="pagehead__row">
          <div className="pagehead__title">
            <PixelHeading id="h1" size="xl">{pageName(slug)}</PixelHeading>
          </div>
        </div>
      </section>
      <main className={`prose page-${slug.replace(/\//g, '-')}`}>
        <Markdown options={{ forceBlock: false, overrides: { a: MdLink } }}>{data}</Markdown>
      </main>
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
