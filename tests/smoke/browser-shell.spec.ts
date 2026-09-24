import {test,expect} from '@playwright/test';

test('startet ohne Electron-Bridge',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('GottesdienstRegie').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('DESKTOP_REQUIRED');
});
