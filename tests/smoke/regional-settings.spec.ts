import {test,expect} from '@playwright/test';

test('settings localize accessibility controls reactively without changing saved audio devices',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('gottesdienstregie.interface-tour','done');
    localStorage.setItem('gottesdienstregie.preferences',JSON.stringify({version:84,state:{language:'fr',germanRegion:null,audioOutputDevice:'operator-usb-fixture',audioInputDevice:'microphone-fixture',highContrast:false}}));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Paramètres',exact:true}).click();
  const settings=page.locator('.settings-modal');
  await settings.locator('nav').getByRole('button',{name:'Accessibility',exact:true}).click();
  const contrast=settings.getByRole('checkbox',{name:/Contraste élevé/});
  await expect(contrast).toBeVisible();
  await expect(settings.getByText('Affiche un cadre de focus bien visible.',{exact:true})).toBeVisible();
  await contrast.check();
  await settings.locator('nav').getByRole('button',{name:'Général',exact:true}).click();
  await settings.getByRole('combobox',{name:'Langue',exact:true}).selectOption('de');
  await settings.locator('nav').getByRole('button',{name:'Barrierefreiheit',exact:true}).click();
  await expect(settings.getByRole('checkbox',{name:/Hoher Kontrast/})).toBeChecked();
  await expect(settings.getByText('Zeigt einen gut sichtbaren Fokusrahmen.',{exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gottesdienstregie.preferences')!).state);
  expect(saved.audioOutputDevice).toBe('operator-usb-fixture');
  expect(saved.audioInputDevice).toBe('microphone-fixture');
  expect(saved.highContrast).toBe(true);
  expect(saved.language).toBe('de');
});

test('Web-Einstellungen zeigen alle Regionalvarianten und behalten Audioeinstellungen',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('gottesdienstregie.interface-tour','done');
    localStorage.setItem('gottesdienstregie.preferences',JSON.stringify({version:84,state:{language:'de',germanRegion:null,audioOutputDevice:'retained-usb-output',audioInputDevice:'retained-input',theme:'light'}}));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  const settings=page.locator('.settings-modal');
  const selector=settings.locator('.regional-selector select');
  await expect(selector).toHaveAccessibleName('Deutsche Regionalvariante');
  await expect(selector.locator('option')).toHaveCount(32);
  await selector.selectOption('hamburg');
  await expect(selector).toHaveValue('hamburg');
  await expect(settings.getByRole('note')).toHaveCount(0);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gottesdienstregie.preferences')!).state);
  expect(saved.germanRegion).toBe('hamburg');
  expect(saved.audioOutputDevice).toBe('retained-usb-output');
  expect(saved.audioInputDevice).toBe('retained-input');
  await page.screenshot({path:'work/web-regional-settings-desktop.png'});
  await page.setViewportSize({width:900,height:1100});
  await expect(selector).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'work/web-regional-settings-tablet.png'});
});
