import {describe,expect,it} from 'vitest';
import {attachOutputRevision,numberSuggestions} from './release55Model';

describe('version 55 regression helpers',()=>{
  it('adds an output revision without mutating a frozen rendered slide',()=>{
    const frozen=Object.freeze({id:'slide-1',elements:Object.freeze([])});
    const result=attachOutputRevision(frozen,7);
    expect(result).toEqual({id:'slide-1',elements:[],_outputRevision:7});
    expect(result).not.toBe(frozen);
    expect('_outputRevision' in frozen).toBe(false);
  });

  it('creates bounded chapter and verse suggestions',()=>{
    expect(numberSuggestions(3)).toEqual([1,2,3]);
    expect(numberSuggestions(0)).toEqual([]);
    expect(numberSuggestions(999)).toHaveLength(176);
  });
});
