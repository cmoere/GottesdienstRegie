import {describe,expect,it} from 'vitest';
import {createRegionalDocumentationStore,validateRegionalDocumentation} from './documentation';
const source={help:{updates:{title:'Updates',body:'Version {version} prüfen.\n\nMehr: https://example.test/help',related:['live']}},helpUI:{title:'Hilfe'},releases:{'versions[0.83].title':'Version {version}'}};
const pack=(id='ruhr')=>({id,help:{updates:{title:'Updates angucken',body:'Version {version} nachgucken.\n\nMehr: https://example.test/help',related:['live']}},helpUI:{title:'Hilfe für dich'},releases:{'versions[0.83].title':'Version {version} für dich'}});
describe('regional documentation boundaries',()=>{
  it('rejects changed technical numbers and build versions inside translated prose',()=>{
    const numbered={...source,releases:{'versions[0.83].title':'Version 0.83.0 prüft das Fenster von 61 Minuten.'}};
    const changed=pack();changed.releases['versions[0.83].title']='Version 0.83.1 prüft das Fenster von 62 Minuten.';
    expect(validateRegionalDocumentation(changed,'ruhr',numbered)).toContain('releases.versions[0.83].title: numeric-fact-mismatch');
  });
  it('requires complete help, labels and stable release paths without losing links or placeholders',()=>{
    expect(validateRegionalDocumentation(pack(),'ruhr',source)).toEqual([]);
    const missing=pack();delete (missing.releases as Record<string,string>)['versions[0.83].title'];
    expect(validateRegionalDocumentation(missing,'ruhr',source)).toContain('releases.versions[0.83].title: missing-text');
    const changed=pack();changed.help.updates.body='Version prüfen.\n\nMehr: https://wrong.test';changed.help.updates.related=['other'];
    const issues=validateRegionalDocumentation(changed,'ruhr',source);
    expect(issues).toContain('help.updates.body: placeholder-mismatch');
    expect(issues).toContain('help.updates.body: link-mismatch');
    expect(issues).toContain('help.updates.related: identity-mismatch');
  });
  it('keeps late A and active B separately cached and freezes all translated content',async()=>{
    let finish!:(value:unknown)=>void;
    const first=pack();const second=pack('berlin');
    const store=createRegionalDocumentationStore({ruhr:()=>new Promise(resolve=>{finish=resolve}),berlin:async()=>second},source);
    const pending=store.load('ruhr');await store.load('berlin');finish(first);await pending;
    const selected=store.get({language:'de',germanRegion:'berlin'})!;
    expect(selected.id).toBe('berlin');expect(Object.isFrozen(selected.help.updates.related)).toBe(true);
    expect(Object.isFrozen(selected.help.updates)).toBe(true);
    expect(store.get({language:'en',germanRegion:'berlin'})).toBeUndefined();
    second.help.updates.body='MUTATED';expect(selected.help.updates.body).not.toBe('MUTATED');
  });
  it('rejects partial documentation and permits a corrected retry',async()=>{
    let attempt=0;
    const store=createRegionalDocumentationStore({ruhr:async()=>++attempt===1?{id:'ruhr',help:{},helpUI:{},releases:{}}:pack()},source);
    expect(await store.load('ruhr')).toBe(false);expect(store.get({language:'de',germanRegion:'ruhr'})).toBeUndefined();
    expect(await store.load('ruhr')).toBe(true);
    expect(store.get({language:'de',germanRegion:'ruhr'})?.helpUI.title).toBe('Hilfe für dich');
  });
});
