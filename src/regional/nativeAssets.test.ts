import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url);
it('packages authored native resources as raw JSON independently of renderer chunks',()=>{
  const directory=mkdtempSync(path.join(os.tmpdir(),'regie-regional-assets-'));
  try{
    const {copyRegionalAssets}=require('../../scripts/copy-regional-assets.cjs');
    const count=copyRegionalAssets(path.resolve('shared/regional/packs'),directory);
    expect(count).toBe(31);
    expect(JSON.parse(readFileSync(path.join(directory,'ruhr.json'),'utf8')))
      .toEqual(JSON.parse(readFileSync('shared/regional/packs/ruhr.json','utf8')));
    expect(copyRegionalAssets(path.resolve('shared/regional/packs'),directory)).toBe(31);
  }finally{rmSync(directory,{recursive:true,force:true})}
});
