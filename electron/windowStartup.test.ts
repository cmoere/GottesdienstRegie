import {describe,expect,it} from 'vitest';
import {resolveOperatorWindowStartup} from './windowStartup';

const displays=[{id:1,workArea:{x:0,y:0,width:1920,height:1040},bounds:{x:0,y:0,width:1920,height:1080}}];

describe('resolveOperatorWindowStartup',()=>{
  it('starts with desktop bounds before a renderer ready signal',()=>{
    const result=resolveOperatorWindowStartup({windowStartMode:'window',operatorDisplayTarget:'primary'},displays,1);
    expect(result.bounds).toEqual({x:96,y:52,width:1728,height:936});
    expect(result.minimumSize).toEqual({width:960,height:620});
    expect(result.resizable).toBe(true);
    expect(result.maximizable).toBe(true);
  });
  it('discards stored bounds outside every attached display',()=>{
    const result=resolveOperatorWindowStartup({windowStartMode:'restore',operatorDisplayTarget:'last',lastDisplayId:99,lastWindowState:'window',bounds:{x:9000,y:9000,width:410,height:700}},displays,1);
    expect(result.bounds).toEqual({x:96,y:52,width:1728,height:936});
    expect(result.startMode).toBe('window');
  });
});
