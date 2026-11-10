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

test('wechselt am Handy den Arbeitsmodus und meldet Offlinebetrieb', async ({page, context}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.addInitScript(() => {
    localStorage.setItem('gottesdienstregie.interface-tour', 'done');
    localStorage.setItem('gottesdienstregie.preferences', JSON.stringify({version:84,state:{language:'de',germanRegion:null}}));
  });
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await page.locator('.service-sidebar-shell').getByRole('button', {name: 'Element hinzufügen'}).click();
  await page.locator('.add-content-popover').getByRole('button', {name: 'Inhalt', exact: true}).click();
  const nav = page.getByRole('navigation', {name: 'Arbeitsbereiche'});
  const preview = nav.getByRole('button', {name: 'Vorschau'});
  await preview.click();
  await expect(preview).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.production-app')).toHaveClass(/mode-preview/);
  await nav.getByRole('button', {name: 'Folie', exact: true}).click();
  await expect(page.locator('.production-app')).toHaveClass(/mode-edit/);
  await context.setOffline(true);
  await expect(page.locator('.web-status-row')).toContainText('Offline');
});
