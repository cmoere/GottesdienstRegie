import {test,expect} from '@playwright/test';

test('startet ohne Electron-Bridge',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.getByText('GottesdienstRegie').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('DESKTOP_REQUIRED');
  await expect(page.getByRole('button',{name:/^(Datei|File)$/})).toBeVisible();
  await expect(page.getByText('GERÄT REGISTRIEREN')).toHaveCount(0);
});

for(const viewport of [{name:'tablet',width:900,height:1100},{name:'phone',width:390,height:844}]){
  test(`${viewport.name} zeigt touchfähige Arbeitsbereiche`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('navigation',{name:'Arbeitsbereiche'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Ablauf'})).toHaveCSS('min-height','48px');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
