import {expect,it} from 'vitest';
import fs from 'node:fs';
import {currentHelpImages,helpScreenshot} from './helpAssets';
it('bundles readable native captures for every referenced current help image',()=>{
  for(const name of currentHelpImages){
    const data=fs.readFileSync(`public/help/${name}`);expect(data.subarray(1,4).toString()).toBe('PNG');
    expect(data.readUInt32BE(16),name).toBeGreaterThanOrEqual(1000);expect(data.readUInt32BE(20),name).toBeGreaterThanOrEqual(700);
  }
  expect(helpScreenshot('Timer')).toBe('countdown-library.png');expect(helpScreenshot('missing')).toBeUndefined();
});
