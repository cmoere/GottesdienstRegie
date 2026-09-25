import {describe,expect,it} from 'vitest';
import {platformLinkFor} from './platformLinks';

describe('platform links',()=>{
  it('uses only the approved public destinations',()=>{
    expect(platformLinkFor('web-editor')).toBe('https://cmoere.github.io/GottesdienstRegie/editor/');
    expect(platformLinkFor('desktop-download')).toBe('https://github.com/cmoere/GottesdienstRegie/releases/latest');
  });
});
