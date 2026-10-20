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
