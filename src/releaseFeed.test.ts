import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url);
it('publishes valid RSS with permanent per-version links and safely escaped complete notes',()=>{
 const {generateReleaseFeed}=require('../scripts/generate-release-feed.cjs');
 const build={version:'0.85.0',releaseDate:'2026-10-21',overview:{label:{de:'Neu & wichtig'},text:{de:'<Hinweis> vollständig'}},sections:{fixed:[{label:{de:'Ausgabe'},text:{de:'Sicher & synchron'}}]}};
 const xml=generateReleaseFeed({versions:[{builds:[build]}]});
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 expect(doc.querySelector('parsererror')).toBeNull();
 expect(doc.querySelector('rss')?.getAttribute('version')).toBe('2.0');
 expect(doc.querySelectorAll('item')).toHaveLength(1);
 expect(doc.querySelector('item guid')?.textContent).toBe('https://cmoere.github.io/GottesdienstRegie/release-notes/#version-0.85.0');
 expect(doc.querySelector('item description')?.textContent).toContain('<Hinweis> vollständig');
 expect(doc.querySelector('item description')?.textContent).toContain('Sicher & synchron');
 expect(new Date(doc.querySelector('item pubDate')!.textContent!).toISOString()).toBe('2026-10-21T00:00:00.000Z');
 expect(xml).not.toContain('<Hinweis>');
});
