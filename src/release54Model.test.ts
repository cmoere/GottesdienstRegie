import {describe,expect,it} from 'vitest';
import {nextGenerationSeed,outputRevision,shouldApplyOutputRevision,spellCheckerLanguages} from './release54Model';

describe('version 0.54 language-aware spelling',()=>{
  it('selects the dictionary for the chosen application language',()=>{
    expect(spellCheckerLanguages('de')).toEqual(['de-DE']);
    expect(spellCheckerLanguages('gsw')).toEqual(['de-CH']);
    expect(spellCheckerLanguages('en')).toEqual(['en-US']);
    expect(spellCheckerLanguages('fr')).toEqual(['fr']);
  });
});

describe('version 0.54 output synchronization',()=>{
  it('changes the revision when the current live slide content changes',()=>{
    expect(outputRevision({id:'slide-1',body:'Alt'})).not.toBe(outputRevision({id:'slide-1',body:'Neu'}));
  });
  it('rejects delayed output frames older than the currently rendered frame',()=>{
    expect(shouldApplyOutputRevision(12,13)).toBe(true);
    expect(shouldApplyOutputRevision(13,12)).toBe(false);
  });
});

describe('version 0.54 AI motif variants',()=>{
  it('creates a new seed for repeated generations with the same controls',()=>{
    expect(nextGenerationSeed('Berge','nature','light',100)).not.toBe(nextGenerationSeed('Berge','nature','light',101));
  });
});
