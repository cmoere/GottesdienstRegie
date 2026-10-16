import { createRequire } from 'node:module';
import {createHash} from 'node:crypto';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
// The scanner must retain ambiguous text for review, never localize user data itself.
const { scanOperatorSource, collectGermanResources, generateInventory,applyReviewedTechnicalFile } = require('../../scripts/inventory-regional-texts.cjs');

describe('regional text source inventory', () => {
  it('excludes reviewed technical metadata only while the exact reviewed file content remains unchanged',()=>{
    const source="const fonts=['Cera Pro'];",rows=scanOperatorSource('src/fonts.ts',source);
    const review={'src/fonts.ts':{sha256:createHash('sha256').update(source).digest('hex'),reason:'Proper font family names, not UI prose.'}};
    expect(applyReviewedTechnicalFile(rows,'src/fonts.ts',source,review)[0]).toMatchObject({status:'excluded',exclusionReason:review['src/fonts.ts'].reason});
    expect(applyReviewedTechnicalFile(rows,'src/fonts.ts',source+' // changed',review)[0].status).toBe('review-required');
    expect(rows[0].status).toBe('review-required');
  });
  it('does not demand retranslating existing non-German siblings inside local language dictionaries',()=>{
    const found=scanOperatorSource('src/fixture.ts',`const copy={de:{message:'Datei öffnen'},en:{message:'Open file'},'pt-BR':{message:'Abrir arquivo'}}; const unrelated={en:'Visible code without a German sibling'};`);
    expect(found.map((entry:{text:string})=>entry.text)).toEqual(['Datei öffnen','Visible code without a German sibling']);
  });
  it('inventories assembled current help and canonical native dialogs rather than retired raw help',()=>{
    const inventory=generateInventory(process.cwd());
    const entries=inventory.entries as Array<{key:string;text:string;status:string}>;
    expect(entries.filter(entry=>entry.key.startsWith('native.'))).toHaveLength(33);
    expect(entries.find(entry=>entry.key==='help.Erste Schritte.body')?.text).toContain('## ');
    expect(entries.find(entry=>entry.key==='helpUI.title')?.text).toBe('Hilfe');
    expect(entries.find(entry=>entry.key==='native.updateInstallOnExit')?.text).toBe('Beim Beenden installieren');
    expect(inventory.complete).toBe(false);
  });
  it('recognizes the real const-asserted German dictionary rather than losing its stable keys', () => {
    expect(scanOperatorSource('src/i18n.ts', "const de = {close:'SCHLIESSEN'} as const;"))
      .toEqual([expect.objectContaining({key:'ui.close',text:'SCHLIESSEN',status:'app-owned'})]);
  });
  it('finds JSX text, accessible labels, native dialog templates and only the German base dictionary', () => {
    const found = scanOperatorSource('src/fixture.tsx', `
      import Button from './Button';
      const de = {close:'SCHLIESSEN', update:'Version {version} ist bereit.'};
      const en = {close:'CLOSE', update:'Version {version} is ready.'};
      const view = <button className="long-technical-class" title="Fenster schließen">Jetzt schließen</button>;
      dialog.showMessageBox({message:'Änderungen speichern?', detail:\`Version \${version} ist bereit.\`});
    `);
    expect(found.map((entry: { text:string }) => entry.text)).toEqual([
      'SCHLIESSEN', 'Version {version} ist bereit.', 'Fenster schließen', 'Jetzt schließen',
      'Änderungen speichern?', 'Version {expression1} ist bereit.',
    ]);
    expect(found[0]).toMatchObject({ source:'src/fixture.tsx', key:'ui.close', status:'app-owned' });
    expect(found.at(-1)).toMatchObject({ status:'review-required' });
    expect(found.every((entry:{line:number}) => entry.line > 0)).toBe(true);
  });

  it('does not confuse imports, technical attributes, keys, comments or dynamic user content with fixed labels', () => {
    const found = scanOperatorSource('src/fixture.tsx', `
      import x from './operator view';
      // Ein Kommentar ist keine Beschriftung.
      const target = { 'Technischer Schlüssel': 1 };
      const view = <section className="technical css" data-testid="some test"><span>{event.titel}</span></section>;
    `);
    expect(found).toEqual([]);
  });

  it('keeps source identity stable when lines move and distinct when equal text has different contexts', () => {
    const source = `const v = <><button>Abbrechen</button><p>Abbrechen</p></>;`;
    const first = scanOperatorSource('src/fixture.tsx', source);
    const moved = scanOperatorSource('src/fixture.tsx', '\n\n' + source);
    expect(first.map((entry:{key:string})=>entry.key)).toEqual(moved.map((entry:{key:string})=>entry.key));
    expect(new Set(first.map((entry:{key:string})=>entry.key)).size).toBe(2);
  });

  it('selects German release fields without inventorying other languages or corrupting identifiers', () => {
    expect(collectGermanResources({versions:[{version:'0.83.0',title:{de:'Neue Ansagen',en:'Announcements'},body:{de:'Text mit {version}',en:'Text'}}]}))
      .toEqual([
        { key:'versions[0.83.0].title', text:'Neue Ansagen' },
        { key:'versions[0.83.0].body', text:'Text mit {version}' },
      ]);
  });

  it('identifies a release line independently of its array position', () => {
    const first = collectGermanResources({versions:[{line:'0.83',builds:[{version:'0.83.0',title:{de:'Ansagen'}}]}]});
    const moved = collectGermanResources({versions:[{line:'0.84',builds:[]},{line:'0.83',builds:[{version:'0.83.0',title:{de:'Ansagen'}}]}]});
    expect(first).toEqual([{key:'versions[0.83].builds[0.83.0].title',text:'Ansagen'}]);
    expect(moved).toEqual(first);
  });
});
