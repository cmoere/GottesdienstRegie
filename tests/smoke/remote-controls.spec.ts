import {expect, test} from '@playwright/test';
import {remotePage} from '../../electron/RemotePage';

test('Fernsteuerung wartet nach einem Folienbefehl auf den neuen Zustand', async ({page}) => {
  let take = 'first';
  let requests = 0;
  let disconnected = false;
  await page.setViewportSize({width: 360, height: 740});
  await page.emulateMedia({colorScheme: 'light'});
  await page.route('**/remote/test', route => route.fulfill({
    contentType: 'text/html',
    body: remotePage('remote', 'Fernsteuerung', 'de', 'test'),
  }));
  await page.route('**/api/state?*', route => disconnected ? route.abort() : route.fulfill({
    json: {onAir: true, current: {id: take, title: take}, annotationTakeId: take, permissions: ['remote.next', 'remote.previous']},
  }));
  await page.route('**/api/*frame?*', route => route.fulfill({status: 503}));
  await page.route('**/api/command', async route => {
    requests++;
    await route.fulfill({status: 202, json: {accepted: true}});
  });

  await page.goto('/remote/test');
  const next = page.locator('[data-action=next]');
  const previous = page.locator('[data-action=previous]');
  await expect(next).toBeEnabled();
  await next.evaluate(button => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.locator('#command-status')).toContainText('Folienwechsel wird verarbeitet');
  await expect(next).toBeDisabled();
  await expect(previous).toBeDisabled();
  expect(requests).toBe(1);
  take = 'second';
  await expect(page.locator('#current')).toHaveText('second');
  await expect(next).toBeEnabled();

  disconnected = true;
  await expect(page.locator('#status')).toHaveText('Verbindung unterbrochen');
  await expect(next).toBeDisabled();
  await expect(page.locator('#live-status')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
