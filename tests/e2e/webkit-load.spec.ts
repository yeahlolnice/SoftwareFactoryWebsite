import { test, expect } from '@playwright/test';

// TASK-028 regression: in WebKit (iPhone 13 emulation) a <video> that shipped with <source> plus controls or <track>
// kept the load event from firing, so module scripts never ran. The page must load and the sizzler must work.
test.describe('sizzler video in WebKit (iPhone 13)', () => {
  test('the load event fires and the module script runs', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 15_000 });
    expect(await page.evaluate(() => document.readyState)).toBe('complete');
    await expect(page.locator('[data-sizzler]')).toHaveAttribute('data-state', /poster|playing/);
    const video = page.locator('#video video');
    expect(await video.evaluate((v: HTMLVideoElement) => v.querySelectorAll('source, track').length)).toBe(0);
  });

  test('play attaches the sources and captions and starts playback', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'load', timeout: 15_000 });
    const play = page.locator('#video .sizzler__play');
    await play.scrollIntoViewIfNeeded();
    await play.click();
    const video = page.locator('#video video');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.querySelectorAll('source').length)).toBe(2);
    expect(await video.evaluate((v: HTMLVideoElement) => ({ controls: v.controls, captions: v.textTracks[0]?.mode })))
      .toEqual({ controls: true, captions: 'showing' });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentSrc), { timeout: 8000 }).toMatch(/\/video\/sizzler\.(mp4|webm)(\?|$)/);
  });
});
