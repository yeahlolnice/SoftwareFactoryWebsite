import { site } from './site';

const context = 'https://schema.org';

const absoluteUrl = (src: string) => new URL(src, site.siteUrl).href;

export const softwareApplicationLd = {
  '@context': context,
  '@type': 'SoftwareApplication',
  name: site.productName,
  description: site.seo.description,
  url: site.siteUrl,
  image: absoluteUrl(site.seo.ogImage),
  // Only the Overview capture: the billing capture's spend figures are not yet confirmed as public (TODO(PO) in site.ts).
  screenshot: [
    {
      '@type': 'ImageObject',
      url: absoluteUrl(site.imagery.overview.src),
      caption: site.imagery.overview.caption,
    },
  ],
  operatingSystem: 'Windows',
  applicationCategory: 'DeveloperApplication',
  downloadUrl: site.download.url,
  publisher: { '@type': 'Organization', name: site.companyName, url: site.siteUrl },
};

export const faqPageLd = {
  '@context': context,
  '@type': 'FAQPage',
  mainEntity: site.faq.items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const { sizzler } = site;

// Shared by the VideoObject, the og:video tags (index.astro) and the video sitemap entry, so they cannot disagree.
export const sizzlerContentUrl = absoluteUrl(sizzler.sources.find((s) => s.type === 'video/mp4')!.src);
export const sizzlerThumbnailUrl = absoluteUrl(sizzler.poster);

export const videoObjectLd = {
  '@context': context,
  '@type': 'VideoObject',
  name: sizzler.title,
  description: sizzler.description,
  thumbnailUrl: [sizzlerThumbnailUrl],
  uploadDate: sizzler.uploadDate,
  duration: sizzler.duration,
  contentUrl: sizzlerContentUrl,
  encodingFormat: 'video/mp4',
  width: sizzler.width,
  height: sizzler.height,
  inLanguage: site.locale,
  transcript: sizzler.cues.map((c) => c.text).join(' '),
  publisher: { '@type': 'Organization', name: site.companyName, url: site.siteUrl },
};

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
