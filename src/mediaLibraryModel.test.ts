import {describe,expect,it} from 'vitest';
import {deleteMethodFor,isAiGenerated,sortRecentlyUsed,validateMediaName} from './mediaLibraryModel';
describe('media library model',()=>{
 it.each([['',false],['   ',false],['a'.repeat(300),true],['a'.repeat(301),false]])('validates media names', (value,ok)=>expect(validateMediaName(value).ok).toBe(ok));
 it('sorts only actual usage',()=>expect(sortRecentlyUsed([{id:'edited',updatedAt:'2026-09-25'} as any,{id:'used',lastUsedAt:'2026-09-24'} as any]).map(x=>x.id)).toEqual(['used']));
 it('migrates the historical KI tag',()=>expect(isAiGenerated({tags:['KI-generiert']})).toBe(true));
 it('deletes local media locally and synced media from the cloud',()=>{expect(deleteMethodFor({visibility:'private'} as any)).toBe('local');expect(deleteMethodFor({visibility:'team'} as any)).toBe('cloud')});
});
