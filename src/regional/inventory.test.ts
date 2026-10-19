import { createRequire } from 'node:module';
import {createHash} from 'node:crypto';
import { describe, expect, it,vi } from 'vitest';

const require = createRequire(import.meta.url);
// The scanner must retain ambiguous text for review, never localize user data itself.
const { scanOperatorSource, collectGermanResources, generateInventory,applyReviewedTechnicalFile,applyReviewedSourceEntries,inventorySourceFingerprint } = require('../../scripts/inventory-regional-texts.cjs');

describe('regional text source inventory', () => {
  it('still scans help UI renderers and helpers while imported article data is separately inventoried',()=>{
    const fs=require('node:fs'),read=fs.readFileSync;
    // Exercise directory-selection policy with the two real help modules, not a
    // second expensive whole-repository scan (covered separately below).
    const list=fs.readdirSync;
    const walk=vi.spyOn(fs,'readdirSync').mockImplementation((...args:unknown[])=>{
      const directory=String(args[0]).replaceAll('\\','/');
      if(directory===process.cwd().replaceAll('\\','/')+'/src')return ['help'];
      if(directory.endsWith('/src/help'))return ['HelpArticleView.tsx','index.ts'];
      if(directory===process.cwd().replaceAll('\\','/')+'/electron')return [];
      return list(...args);
    });
    const spy=vi.spyOn(fs,'readFileSync').mockImplementation((...args:unknown[])=>{
      const result=read(...args);
      const file=String(args[0]).replaceAll('\\','/');
      if(file.endsWith('/src/help/HelpArticleView.tsx'))return String(result)+'\nconst injected=<button>Zusätzliche Hilfeaktion</button>;';
      if(file.endsWith('/src/help/index.ts'))return String(result)+"\nconst injected='Zusätzliche Hilfefunktion';";
      return result;
    });
    try{
      const inventory=generateInventory(process.cwd());
      const rows=inventory.entries as Array<{source:string;text:string;status:string}>;
      expect(rows.find(row=>row.source==='src/help/HelpArticleView.tsx'&&row.text==='Zusätzliche Hilfeaktion')).toMatchObject({status:'review-required'});
      expect(rows.find(row=>row.source==='src/help/index.ts'&&row.text==='Zusätzliche Hilfefunktion')).toMatchObject({status:'review-required'});
    }finally{spy.mockRestore();walk.mockRestore()}
  });
  it('excludes only the individually reviewed exact source entry in a mixed UI module',()=>{
    const rows=scanOperatorSource('src/mixed.tsx',"const fault='DEVICE_UNAVAILABLE'; const view=<button>Gerät auswählen</button>;");
    const row=rows[0],review={[row.key]:{source:row.source,context:row.context,text:row.text,reason:'Stable machine code, not operator prose.'}};
    const classified=applyReviewedSourceEntries(rows,review);
    expect(classified[0]).toMatchObject({status:'excluded',exclusionReason:review[row.key].reason});
    expect(classified[0].technicalReviewHash).toMatch(/^[a-f0-9]{64}$/);
    expect(classified[1]).toEqual(rows[1]);
    expect(rows[0].status).toBe('review-required');
    expect(inventorySourceFingerprint(classified)).not.toBe(inventorySourceFingerprint(rows));
  });
  it('revokes individual exclusions after source changes and cannot hide canonical owned resources',()=>{
    const [row]=scanOperatorSource('src/mixed.ts',"const fault='DEVICE_UNAVAILABLE';");
    const review={[row.key]:{source:row.source,context:row.context,text:row.text,reason:'Stable machine code.'}};
    for(const altered of [{...row,text:'Gerät nicht verfügbar'},{...row,source:'src/other.ts'},{...row,context:'jsx-text:button'},{...row,key:'ui.device',status:'app-owned'}]){
      expect(applyReviewedSourceEntries([altered],review)[0]).toEqual(altered);
    }
    expect(applyReviewedSourceEntries([row],{[row.key]:{...review[row.key],reason:' '}})[0]).toEqual(row);
    expect(applyReviewedSourceEntries([row],Object.create(review))[0]).toEqual(row);
  });
  it('retains uppercase-only labels in nested German dictionaries for review',()=>{
    const found=scanOperatorSource('src/fixture.ts',"const copy={de:{confirm:'OK',cancel:'ABBRECHEN'},en:{confirm:'OK',cancel:'CANCEL'}};");
    expect(found.map((entry:{text:string})=>entry.text)).toEqual(['OK','ABBRECHEN']);
    expect(found.every((entry:{status:string})=>entry.status==='review-required')).toBe(true);
  });
  it('fingerprints source text independently of line positions and review decisions',()=>{
    const rows=scanOperatorSource('src/fixture.tsx','const view=<button>Abbrechen</button>;');
    const moved=scanOperatorSource('src/fixture.tsx','\n\nconst view=<button>Abbrechen</button>;');
    expect(inventorySourceFingerprint(rows)).toBe(inventorySourceFingerprint(moved));
    expect(inventorySourceFingerprint(rows)).toBe(inventorySourceFingerprint(rows.map((row:object)=>({...row,status:'app-owned'}))));
    const changed=scanOperatorSource('src/fixture.tsx','const view=<button>Jetzt abbrechen</button>;');
    expect(inventorySourceFingerprint(changed)).not.toBe(inventorySourceFingerprint(rows));
  });
  it('excludes reviewed technical metadata only while the exact reviewed file content remains unchanged',()=>{
    const source="const fonts=['Cera Pro'];",rows=scanOperatorSource('src/fonts.ts',source);
    const review={'src/fonts.ts':{sha256:createHash('sha256').update(source).digest('hex'),reason:'Proper font family names, not UI prose.'}};
    expect(applyReviewedTechnicalFile(rows,'src/fonts.ts',source,review)[0]).toMatchObject({status:'excluded',exclusionReason:review['src/fonts.ts'].reason});
    expect(applyReviewedTechnicalFile(rows,'src/fonts.ts',source+' // changed',review)[0].status).toBe('review-required');
    expect(inventorySourceFingerprint(applyReviewedTechnicalFile(rows,'src/fonts.ts',source,review)))
      .not.toBe(inventorySourceFingerprint(applyReviewedTechnicalFile(rows,'src/fonts.ts',source+' // changed',review)));
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
