import { defineConfig } from 'astro/config';
import { site } from './src/data/site.ts';

export default defineConfig({
  site: site.siteUrl,
  output: 'static',
  compressHTML: true,
  devToolbar: { enabled: false },
});
