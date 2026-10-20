import {expect,it} from 'vitest';
import {regionalVariants} from '../../shared/regional/catalog';
import {isRegionalSelectionAvailable} from '../../shared/regional/availability';
const complete={schemaVersion:1,complete:true,regionIds:["bavarian-upper","bavarian-lower","upper-palatinate","east-franconian","swabian","baden-alemannic","south-baden-alemannic","palatine","rhine-hessian","south-hessian","cologne","ruhr","hamburg","berlin","bielefeld-ravensberg"]};
it('requires the explicit complete approved15-region manifest, not inherited or partial flags',()=>{
  expect(isRegionalSelectionAvailable(complete)).toBe(true);
  for(const value of [null,{},Object.create(complete),{...complete,complete:false},{...complete,schemaVersion:2},
    {...complete,regionIds:complete.regionIds.slice(1)},{...complete,regionIds:[...complete.regionIds].reverse()},
    {...complete,regionIds:complete.regionIds.map(()=> 'ruhr')},
    {...complete,regionIds:regionalVariants.map(region=>region.id)}]){
    expect(isRegionalSelectionAvailable(value)).toBe(false);
  }
});
