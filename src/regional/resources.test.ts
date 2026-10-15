import { describe, expect, it } from 'vitest';
import { createRegionalResourceStore, loadRegionalInterfacePack, resolveRegionalText } from './resources';

describe('regional interface resource loading',()=>{
  it('uses the authored local package and retains exact interpolation data',async()=>{
    expect(await loadRegionalInterfacePack('ruhr')).toBe(true);
    expect(resolveRegionalText({language:'de',germanRegion:'ruhr'},'updateChecking')).toBe('Wir gucken nach Updates …');
    expect(resolveRegionalText({language:'de',germanRegion:'ruhr'},'authTechnical', {detail:'{version} / -id / https://example.test/?q=$&'}))
      .toBe('Technischer Fehler bei der Anmeldung: {version} / -id / https://example.test/?q=$&');
  });

  it('does not regionalize other base languages or infer a dialect from the locale',async()=>{
    await loadRegionalInterfacePack('ruhr');
    expect(resolveRegionalText({language:'en',germanRegion:'ruhr'},'checkUpdates')).toBe('CHECK FOR UPDATES');
    expect(resolveRegionalText({language:'de',germanRegion:null},'checkUpdates')).toBe('NACH UPDATES SUCHEN');
    expect(resolveRegionalText({language:'de',germanRegion:'unknown' as never},'checkUpdates')).toBe('NACH UPDATES SUCHEN');
  });

  it('falls back for an absent package without treating it as successfully loaded',async()=>{
    const store=createRegionalResourceStore({},{ui:{close:'Schließen'},native:{}});
    expect(await store.load('bielefeld-ravensberg')).toBe(false);
    expect(store.getTemplate({language:'de',germanRegion:'bielefeld-ravensberg'},'close')).toBeUndefined();
  });

  it('never lets a late package replace the currently requested region',async()=>{
    const base={ui:{close:'Schließen'},native:{}};
    let finishA!:(value:unknown)=>void;
    const store=createRegionalResourceStore({
      ruhr:()=>new Promise(resolve=>{finishA=resolve}),
      berlin:async()=>({id:'berlin',ui:{close:'Zumachen, bitte'},native:{}}),
    },base);
    const first=store.load('ruhr');
    await store.load('berlin');
    expect(store.getTemplate({language:'de',germanRegion:'berlin'},'close')).toBe('Zumachen, bitte');
    finishA({id:'ruhr',ui:{close:'Zumachen'},native:{}});
    await first;
    expect(store.getTemplate({language:'de',germanRegion:'berlin'},'close')).toBe('Zumachen, bitte');
    expect(store.getTemplate({language:'en',germanRegion:'berlin'},'close')).toBeUndefined();
  });

  it('rejects incomplete or mismatched resources and permits a later valid retry',async()=>{
    let attempt=0;
    const store=createRegionalResourceStore({ruhr:async()=>{
      attempt++;
      if(attempt===1)throw new Error('Unavailable');
      if(attempt===2)return {id:'berlin',ui:{close:'Falsch'},native:{}};
      return {id:'ruhr',ui:{close:'Zumachen'},native:{}};
    }},{ui:{close:'Schließen'},native:{}});
    expect(await store.load('ruhr')).toBe(false);
    expect(await store.load('ruhr')).toBe(false);
    expect(store.getTemplate({language:'de',germanRegion:'ruhr'},'close')).toBeUndefined();
    expect(await store.load('ruhr')).toBe(true);
    expect(store.getTemplate({language:'de',germanRegion:'ruhr'},'close')).toBe('Zumachen');
  });
});
