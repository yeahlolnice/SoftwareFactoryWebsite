import { site } from './site';

const context = 'https://schema.org';

export const softwareApplicationLd = {
  '@context': context,
  '@type': 'SoftwareApplication',
  name: site.productName,
  description: site.seo.description,
  url: site.siteUrl,
  image: new URL(site.seo.ogImage, site.siteUrl).href,
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

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
