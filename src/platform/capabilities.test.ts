import {describe,expect,it} from 'vitest';
import {webCapabilities} from './capabilities';

describe('webCapabilities',()=>{
  it('erklärt Desktop-Ausgabe statt sie verfügbar zu melden',()=>{
    expect(webCapabilities.outputMain).toEqual({
      availability:'unavailable',
      reason:'MAIN-Ausgabe benötigt die Desktop-App.'
    });
  });
});
