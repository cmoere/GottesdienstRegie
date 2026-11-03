import {expect,it} from 'vitest';
import {compactSlideHistoryEntry} from './editHistoryPayload';
it('preserves every changed item while removing identical whole-document copies from legacy slide history',()=>{
 const a={id:'a',slides:[{id:'as',body:'unchanged'}]},b={id:'b',slides:[{id:'bs',body:'before'}]},next={...b,slides:[{id:'bs',body:'after'}]},entry={entityType:'slide',category:'FOLIEN',id:'history',before:[a,b],after:[structuredClone(a),next]};
 const result=compactSlideHistoryEntry(entry);expect(result).toEqual({...entry,before:[b],after:[next]});expect(entry.before).toHaveLength(2);
});
it('does not reinterpret other audit types or ambiguous/non-item arrays',()=>{for(const entry of [{entityType:'serviceItem',before:[{id:'a',slides:[]}],after:[{id:'a',slides:[]}]},{entityType:'slide',before:['a'],after:['a']},{entityType:'slide',before:[{id:'a',slides:[]},{id:'a',slides:[]}],after:[{id:'a',slides:[]}]}])expect(compactSlideHistoryEntry(entry)).toBe(entry);});
