import {describe,expect,it} from 'vitest';
import {resolveBundledBibleText} from './text';

describe('bundled Bible text',()=>{
  it('resolves the default single verse used by the dialog',()=>{
    expect(resolveBundledBibleText('JHN',3,16,16)).toMatch(/Denn also hat Gott/);
  });

  it('resolves the bundled range preview',()=>{
    expect(resolveBundledBibleText('JHN',3,16,18)).toMatch(/ewige Leben/);
  });
});
