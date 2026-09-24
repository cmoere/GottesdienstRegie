import {describe,expect,it} from 'vitest';
import {layoutForWidth} from './useWorkspaceLayout';

describe('layoutForWidth',()=>{
  it.each([[1440,'desktop'],[900,'tablet'],[390,'phone']] as const)('ordnet %ipx %s zu',(width,expected)=>expect(layoutForWidth(width)).toBe(expected));
});
