import {describe,expect,it} from 'vitest';
import {setAppOnAir,setAppTestMode,type AppModeState} from './appMode';

describe('AppModeState',()=>{
  const normal:AppModeState={mode:'normal',onAir:false};
  it('supports all independent normal/test and off/on-air combinations',()=>{
    expect(setAppOnAir(normal,true)).toEqual({mode:'normal',onAir:true});
    expect(setAppTestMode(normal,true)).toEqual({mode:'test',onAir:false});
    expect(setAppOnAir({mode:'test',onAir:false},true)).toEqual({mode:'test',onAir:true});
    expect(setAppOnAir({mode:'test',onAir:true},false)).toEqual({mode:'test',onAir:false});
  });
  it('leaves on-air untouched when test mode changes',()=>{
    expect(setAppTestMode({mode:'normal',onAir:true},true)).toEqual({mode:'test',onAir:true});
    expect(setAppTestMode({mode:'test',onAir:true},false)).toEqual({mode:'normal',onAir:true});
  });
});
