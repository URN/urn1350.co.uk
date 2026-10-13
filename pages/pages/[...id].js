import React from 'react';
import Link from 'next/link';
import Markdown from 'markdown-to-jsx';

import Seo from '../../components/Seo';
import Cta from '../../components/Cta';
import PixelHeading from '../../components/PixelHeading';
import Reveal from '../../components/Reveal';
import { ArrowIcon } from '../../components/Icons';
import { fetchCdn } from '../../lib/content';

function MdLink({ href, children, ...props }) {
  const isInternal = href && href.startsWith('/') && !href.startsWith('//');
  if (isInternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  const external = href && /^https?:/i.test(href);
  return (
    <a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

/** Splits the leading "# Title" from the rest of the markdown so the title can use the pixel heading. */
function splitTitle(md, fallback) {
  const m = /^\s*#\s+(.+?)\s*(?:\n|$)/.exec(md);
  if (!m) return { title: fallback, body: md };
  return { title: m[1].replace(/[*_`]/g, ''), body: md.slice(m[0].length) };
}


const MAILTO = /\[[^\]]*\]\(mailto:([^)\s]+)\)/;

/**
 * Get involved is written as "**Team** blurb (email)" paragraphs. Pull those out as
 * cards and leave everything else as prose; if nothing matches the page is unchanged.
 */
function splitTeams(md) {
  const segments = [];
  md.split(/\n\s*\n/).forEach((block) => {
    const text = block.trim();
    if (!text) return;
    const m = /^\*\*([^*]+)\*\*\s*([\s\S]+)$/.exec(text);
    const mail = m && MAILTO.exec(text);
    if (m && mail) {
      const email = mail[1].replace(/\\/g, '');
      const desc = m[2]
        .replace(/\s*\(\s*\[[^\]]*\]\(mailto:[^)]*\)\s*\)/g, '')
        .replace(/\[[^\]]*\]\(mailto:[^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .replace(/[:\s]+$/, '')
        .trim();
      const last = segments[segments.length - 1];
      const card = { name: m[1].replace(/[?:]+$/, '').trim(), desc: `${m[1].trim()} ${desc}`.replace(/\s+/g, ' '), email };
      if (last && last.type === 'cards') last.items.push(card);
      else segments.push({ type: 'cards', items: [card] });
    } else {
      const last = segments[segments.length - 1];
      if (last && last.type === 'md') last.text += `\n\n${text}`;
      else segments.push({ type: 'md', text });
    }
  });
  return segments;
}

function Teams({ items }) {
  return (
    <ul className="teams">
      {items.map((t, i) => (
        <Reveal as="li" className="team" delay={Math.min(i, 5) * 70} key={t.name}>
          <h3 className="team__name caps caps--butter">{t.name}</h3>
          <div className="team__desc"><Markdown options={{ forceBlock: false, overrides: { a: MdLink } }}>{t.desc}</Markdown></div>
          <a className="team__mail" href={`mailto:${t.email}`}>{t.email}<ArrowIcon size={16} /></a>
        </Reveal>
      ))}
    </ul>
  );
}

function slugTitle(slug) {
  return slug
    .replace(/\//g, ' ')
    .split(/[-\s]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function Page({ data, slug }) {
  const { title, body } = splitTitle(data, slugTitle(slug));
  const description = body.replace(/[#*_>\[\]`]/g, '').replace(/\(([^)]*)\)/g, '').trim().slice(0, 180);
  const cls = `page-${slug.replace(/\//g, '-')}`;
  const split = slug === 'get-involved' ? splitTeams(body) : [];
  const segments = split.some((x) => x.type === 'cards') ? split : [{ type: 'md', text: body }];
  const showCta = slug === 'about' || slug.startsWith('committee');

  return (
    <>
      <Seo title={title} description={description} />
      <article className={`doc ${cls}`}>
        <header className="doc__head">
          <PixelHeading size="xl">{title}</PixelHeading>
        </header>
        {segments.map((seg, i) =>
          seg.type === 'cards' ? (
            <Teams items={seg.items} key={`c${i}`} />
          ) : (
            <div className="prose" key={`m${i}`}>
              <Markdown options={{ forceBlock: false, overrides: { a: MdLink } }}>{seg.text}</Markdown>
            </div>
          )
        )}
      </article>
      {showCta ? (
        <Cta heading="Want to join us?" href="/pages/get-involved" label="Get involved" />
      ) : null}
    </>
  );
}

export async function getServerSideProps({ query, res }) {
  const segments = [].concat(query.id || []);
  let data = null;
  try {
    data = await fetchCdn(`website/${segments.map(encodeURIComponent).join('/')}`);
  } catch (err) {
    data = null;
  }
  if (!data || /^\s*<(!doctype|html)/i.test(data)) return { notFound: true };
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return { props: { data, slug: segments.join('/') } };
}
