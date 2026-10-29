import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const require=createRequire(import.meta.url);
const {requiresFullRegionalCatalog}=require('../../scripts/check-version84.cjs');

it('requires the entire 31-region catalog from v95 onward, retaining the older disclosed release policy',()=>{
  for(const version of ['0.95.0','0.95.1','0.96.0','1.0.0'])expect(requiresFullRegionalCatalog(version)).toBe(true);
  for(const version of ['0.84.0','0.94.0','0.94.1'])expect(requiresFullRegionalCatalog(version)).toBe(false);
});
