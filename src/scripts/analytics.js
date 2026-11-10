// Google Tag Manager, loaded from an external bundle so the CSP needs no inline script.
// Equivalent to Google's standard GTM snippet: queue the gtm.js start event, then load the container.
// The container ID comes from site.analytics.gtmId via <html data-gtm-id>; no ID means no tracking.
const id = document.documentElement.dataset.gtmId;

if (id) {
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  // Every installer link is a Button with cta="download" (hero, download section, agent team).
  // In GTM: Trigger = Custom Event "download_click"; read the fields below with Data Layer Variables.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[data-cta="download"]') : null;
    if (!link) return;
    const url = new URL(link.href, location.href);
    dataLayer.push({
      event: 'download_click',
      file_name: url.pathname.split('/').pop(),
      link_url: url.href,
      link_text: link.textContent.trim(),
      cta_location: link.closest('[id]')?.id ?? '',
    });
  });
}
