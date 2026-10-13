import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { sizzlerContentUrl, sizzlerThumbnailUrl } from '../data/structured-data';

const pages = ['/'];

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const { sizzler } = site;
// Google video sitemap entry (sitemap-video/1.1) for the Sizzler video on the home page.
const videoXml = [
  `<video:video>`,
  `<video:thumbnail_loc>${escapeXml(sizzlerThumbnailUrl)}</video:thumbnail_loc>`,
  `<video:title>${escapeXml(sizzler.title)}</video:title>`,
  `<video:description>${escapeXml(sizzler.description)}</video:description>`,
  `<video:content_loc>${escapeXml(sizzlerContentUrl)}</video:content_loc>`,
  `<video:duration>${Number(sizzler.duration.match(/(\d+)S$/)![1])}</video:duration>`,
  `<video:publication_date>${sizzler.uploadDate}</video:publication_date>`,
  `</video:video>`,
].join('');

export const GET: APIRoute = () => {
  const urls = pages
    .map((path) => {
      const loc = escapeXml(new URL(path, site.siteUrl).href);
      return `  <url><loc>${loc}</loc>${path === '/' ? videoXml : ''}</url>`;
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
