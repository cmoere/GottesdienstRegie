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

it('accepts an explicitly disclosed version-pinned partial release, but not misleading or inherited disclosures',()=>{
  const partial={...complete,complete:false,partialRelease:{version:'0.84.0',inventoryFingerprint:'a'.repeat(64),notice:'Regionalvarianten sind noch nicht vollständig übersetzt. Fehlende UI-Texte werden auf Hochdeutsch angezeigt.'}};
  expect(isRegionalSelectionAvailable(partial)).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.85.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.86.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.87.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.88.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.89.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.89.1'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.89.2'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.89.3'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.90.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.91.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.92.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.93.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.94.0'}})).toBe(true);
  expect(isRegionalSelectionAvailable({...partial,partialRelease:{...partial.partialRelease,version:'0.94.1'}})).toBe(false);
  for(const value of [
    {...partial,complete:true},
    {...partial,partialRelease:{...partial.partialRelease,version:'0.90.1'}},
    {...partial,partialRelease:{...partial.partialRelease,version:'0.89.4'}},
    {...partial,partialRelease:{...partial.partialRelease,notice:'Alle Texte sind vollständig.'}},
    {...partial,partialRelease:{...partial.partialRelease,inventoryFingerprint:'unknown'}},
    {...partial,partialRelease:Object.create(partial.partialRelease)},
    {...partial,regionIds:partial.regionIds.slice(1)},
  ])expect(isRegionalSelectionAvailable(value)).toBe(false);
});
