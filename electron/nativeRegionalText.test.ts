import {describe,expect,it} from 'vitest';
import {createNativeRegionalText} from './nativeRegionalText';
import {nativeBaseTemplates} from '../shared/regional/nativeBase';

describe('native regional dialog templates',()=>{
  it('uses safe base text until a complete matching native namespace is available',async()=>{
    const translator=createNativeRegionalText(async()=>({id:'ruhr',native:{cancel:'Lassen'}}));
    expect(translator.text('updateAvailableMessage',{version:'0.84.0'})).toBe('GottesdienstRegie 0.84.0 ist verfügbar.');
    expect(await translator.select({language:'de',germanRegion:'ruhr'})).toBe(false);
    expect(translator.text('cancel')).toBe('Abbrechen');
  });
  it('adopts complete native resources and preserves literal interpolation values',async()=>{
    const translator=createNativeRegionalText(async()=>({id:'ruhr',native:{...nativeBaseTemplates,
      updateAvailableMessage:'GottesdienstRegie {version} is verfügbar.',cancel:'Abbrechen, bitte'}}));
    expect(await translator.select({language:'de',germanRegion:'ruhr'})).toBe(true);
    expect(translator.text('updateAvailableMessage',{version:'{detail} / -id'}))
      .toBe('GottesdienstRegie {detail} / -id is verfügbar.');
    expect(translator.text('cancel')).toBe('Abbrechen, bitte');
    await translator.select({language:'en',germanRegion:'ruhr'});
    expect(translator.text('cancel')).toBe('Abbrechen');
  });
  it('does not replace a later selection when an earlier package completes late',async()=>{
    let resolveA!:(value:unknown)=>void;
    const translator=createNativeRegionalText(id=>id==='ruhr'?new Promise(resolve=>{resolveA=resolve})
      :Promise.resolve({id:'berlin',native:{...nativeBaseTemplates,cancel:'Doch nich'}}));
    const first=translator.select({language:'de',germanRegion:'ruhr'});
    await translator.select({language:'de',germanRegion:'berlin'});
    resolveA({id:'ruhr',native:{...nativeBaseTemplates,cancel:'Doch nich machen'}});
    await first;
    expect(translator.text('cancel')).toBe('Doch nich');
  });
});
