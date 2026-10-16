import {expect,it} from 'vitest';
import {regionalVariants} from '../../shared/regional/catalog';
import {isRegionalSelectionAvailable} from '../../shared/regional/availability';
const complete={schemaVersion:1,complete:true,regionIds:regionalVariants.map(region=>region.id)};
it('requires an explicit complete ordered31-region manifest, not inherited or partial flags',()=>{
  expect(isRegionalSelectionAvailable(complete)).toBe(true);
  for(const value of [null,{},Object.create(complete),{...complete,complete:false},{...complete,schemaVersion:2},
    {...complete,regionIds:complete.regionIds.slice(1)},{...complete,regionIds:[...complete.regionIds].reverse()},
    {...complete,regionIds:complete.regionIds.map(()=> 'ruhr')}]){
    expect(isRegionalSelectionAvailable(value)).toBe(false);
  }
});
