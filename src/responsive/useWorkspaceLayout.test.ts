import {describe,expect,it} from 'vitest';
import {layoutForWidth} from './useWorkspaceLayout';
import {useWorkspaceLayout} from './useWorkspaceLayout';
import {renderHook,cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
const initialWidth=window.innerWidth;
afterEach(()=>{cleanup();Object.defineProperty(window,'innerWidth',{configurable:true,value:initialWidth})});

describe('layoutForWidth',()=>{
  it('rechecks a viewport change between the first render and resize-listener installation',()=>{
    Object.defineProperty(window,'innerWidth',{configurable:true,value:410});let first=true;
    const{result}=renderHook(()=>{const layout=useWorkspaceLayout();if(first){first=false;Object.defineProperty(window,'innerWidth',{configurable:true,value:1920})}return layout});
    expect(result.current).toBe('desktop');
  });
  it.each([[1440,'desktop'],[900,'tablet'],[390,'phone']] as const)('ordnet %ipx %s zu',(width,expected)=>expect(layoutForWidth(width)).toBe(expected));
});
