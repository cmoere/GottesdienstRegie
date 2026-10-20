import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {beforeAll,describe,expect,it} from 'vitest';
import {getHelpCatalog} from '../help';
const require=createRequire(import.meta.url);
const {getGermanDocumentationSource}=require('../../scripts/export-regional-corpus.cjs');

describe('complete German documentation translation source',()=>{
  let source:{help:Record<string,{title:string;body:string;related?:string[]}>;helpUI:Record<string,string>;releases:Record<string,string>};
  beforeAll(()=>{source=getGermanDocumentationSource(path.resolve('.'))});
  it('exports the assembled current help, including enhancements and related topic identities',()=>{
    const current=getHelpCatalog('de');
    expect(Object.keys(source.help)).toHaveLength(63);
    expect(source.helpUI).toEqual(current.ui);
    for(const article of current.topics){
      expect(source.help[article.id]).toEqual({title:article.title,body:article.body,...(article.related?{related:article.related}:{})});
    }
    expect(source.help['Erste Schritte'].body).toContain('## ');
  });
  it('keeps all historical release text fields keyed by stable version identity',()=>{
    expect(Object.keys(source.releases)).toHaveLength(1456);
    expect(source.releases['versions[0.84].builds[0.84.0].overview.label']).toBe('Regionale Bedienoberfläche mit 15 Varianten');
    expect(source.releases['versions[0.84].builds[0.84.0].sections.known.0.text']).toContain('Fehlende UI-Texte werden auf Hochdeutsch angezeigt.');
    expect(source.releases['versions[0.83].builds[0.83.0].overview.label']).toBe('Ansagen vorbereiten und Audiosteuerung absichern');
    expect(source.releases['versions[0.83].builds[0.83.0].overview.text']).toContain('ausschließlich die Vorbereitung');
  });
  it('can export repeatedly into the existing ignored working directory',()=>{
    const root=path.resolve('.');
    execFileSync(process.execPath,['scripts/export-regional-corpus.cjs'],{cwd:root,stdio:'pipe'});
    const before=readFileSync(path.join(root,'work/v84-regional-source.json'),'utf8');
    execFileSync(process.execPath,['scripts/export-regional-corpus.cjs'],{cwd:root,stdio:'pipe'});
    expect(readFileSync(path.join(root,'work/v84-regional-source.json'),'utf8')).toBe(before);
    expect(Object.keys(JSON.parse(before).help)).toHaveLength(63);
  });
});
