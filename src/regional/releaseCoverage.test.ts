import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const { checkRegionalCoverage,checkInventoryFreshness } = require('../../scripts/check-regional-resources.cjs');

const regions=[{id:'ruhr',name:'Ruhrdeutsch'}];
const inventory={complete:true,entries:[
  {key:'ui.close',text:'Schließen',status:'app-owned'},
  {key:'native.error',text:'Fehler: {detail}',status:'app-owned'},
  {key:'help.Start.title',text:'Erste Schritte',status:'app-owned'},
  {key:'helpUI.title',text:'Hilfe',status:'app-owned'},
  {key:'release.versions[0.83].builds[0.83.0].title',text:'Ansagen',status:'app-owned'},
]};
const packs={ruhr:{id:'ruhr',ui:{close:'Zumachen'},native:{error:'Fehler: {detail}'}}};
const docs={ruhr:{
  help:{Start:{title:'Erste Schritte'}},
  helpUI:{title:'Hilfe'},
  releases:{'versions[0.83].builds[0.83.0]':{title:'Ansagen'}},
}};

describe('v84 release resource coverage gate',()=>{
  it('rejects a reviewed inventory when the current source corpus has changed',()=>{
    expect(checkInventoryFreshness({complete:true,sourceFingerprint:'before'},{sourceFingerprint:'after'})).toEqual(['inventory: stale source fingerprint']);
    expect(checkInventoryFreshness({sourceFingerprint:'same'},{sourceFingerprint:'same'})).toEqual([]);
    expect(checkInventoryFreshness({},{})).toEqual(['inventory: stale source fingerprint']);
  });
  it('requires translated help chrome independently of complete articles',()=>{
    expect(checkRegionalCoverage({regions,inventory,packs,docs:{ruhr:{...docs.ruhr,helpUI:{}}}}))
      .toContain('ruhr: helpUI.title missing-text');
  });
  it('accepts a reviewed complete inventory with every required UI, native, help and release field',()=>{
    expect(checkRegionalCoverage({regions,inventory,packs,docs})).toEqual([]);
  });
  it('fails closed while text classification or inventory completion is pending',()=>{
    expect(checkRegionalCoverage({regions,inventory:{...inventory,complete:false},packs,docs}))
      .toContain('inventory: incomplete');
    expect(checkRegionalCoverage({regions,inventory:{...inventory,entries:[...inventory.entries,
      {key:'source.pending',text:'Offener Text',status:'review-required'}]},packs,docs}))
      .toContain('inventory: source.pending requires classification');
  });
  it('reports missing packs and documentation independently rather than accepting fallback',()=>{
    expect(checkRegionalCoverage({regions,inventory,packs:{},docs:{}}))
      .toEqual(['ruhr: missing interface pack','ruhr: missing documentation pack']);
  });
  it('catches changed placeholders and missing historical release notes',()=>{
    const issues=checkRegionalCoverage({regions,inventory,packs:{ruhr:{...packs.ruhr,native:{error:'Fehler'}}},
      docs:{ruhr:{help:docs.ruhr.help,releases:{}}}});
    expect(issues).toContain('ruhr: native.error placeholder-mismatch');
    expect(issues).toContain('ruhr: release.versions[0.83].builds[0.83.0].title missing-text');
  });
  it('rejects duplicate inventory keys and unknown app-owned resource namespaces',()=>{
    const issues=checkRegionalCoverage({regions,inventory:{...inventory,entries:[...inventory.entries,
      inventory.entries[0],{key:'unmapped.text',text:'Fehlt',status:'app-owned'}]},packs,docs});
    expect(issues).toContain('inventory: duplicate key ui.close');
    expect(issues).toContain('inventory: unmapped.text has no resource namespace');
  });
  it('cannot certify empty source categories as complete translations',()=>{
    const issues=checkRegionalCoverage({regions,inventory:{complete:true,entries:[]},
      packs:{ruhr:{id:'ruhr',ui:{},native:{}}},docs:{ruhr:{help:{},releases:{}}}});
    expect(issues).toEqual(expect.arrayContaining([
      'inventory: missing ui corpus','inventory: missing native corpus',
      'inventory: missing help corpus','inventory: missing release corpus',
    ]));
  });
});
