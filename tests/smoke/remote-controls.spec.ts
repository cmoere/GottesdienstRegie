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

test('überträgt unveränderte nächste Folien einmal und markiert mit der gewählten Farbe', async ({page}) => {
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jPnoAAAAASUVORK5CYII=', 'base64');
  let nextRevision = 1;
  let nextRequests = 0;
  let submittedColor: string | undefined;
  await page.route('**/remote/test', route => route.fulfill({
    contentType: 'text/html',
    body: remotePage('remote', 'Fernsteuerung', 'de', 'test'),
  }));
  await page.route('**/api/state?*', route => route.fulfill({
    json: {onAir: true, current: {title: 'Aktuell'}, next: {title: 'Danach'}, nextPreviewRevision: nextRevision, canAnnotate: true, annotationTakeId: 'test'},
  }));
  await page.route('**/api/frame?*', route => route.fulfill({contentType: 'image/png', body: pixel}));
  await page.route('**/api/next-frame?*', route => {
    nextRequests++;
    return route.fulfill({contentType: 'image/png', body: pixel});
  });
  await page.route('**/api/command', route => {
    submittedColor = route.request().postDataJSON().stroke?.color;
    return route.fulfill({status: 202, json: {accepted: true}});
  });
  await page.goto('/remote/test');
  await expect(page.locator('#next-mirror')).toBeVisible();
  const purple = page.getByRole('button', {name: 'Violett'});
  await purple.click();
  await expect(purple).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#draw').click();
  const canvas = page.locator('#drawing');
  await canvas.scrollIntoViewIfNeeded();
  const frame = await canvas.boundingBox();
  expect(frame).not.toBeNull();
  await page.mouse.move(frame!.x+frame!.width/2,frame!.y+frame!.height/2);
  await page.mouse.down();
  await page.mouse.move(frame!.x+frame!.width/2+24,frame!.y+frame!.height/2+24);
  await page.mouse.up();
  await expect.poll(()=>submittedColor).toBe('#bf5af2');
  const fullscreen = page.locator('#fullscreen');
  await expect(fullscreen).toHaveAccessibleName('Vollbild');
  await expect(fullscreen).toHaveText('');
  expect(nextRequests).toBe(1);
  nextRevision++;
  await expect.poll(()=>nextRequests).toBe(2);
});
