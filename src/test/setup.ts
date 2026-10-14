import '@testing-library/jest-dom/vitest';
import {afterAll} from 'vitest';

// Module singletons (e.g. the audio health publisher) outlive individual tests.
// Dispose their window timers before jsdom removes window, not after teardown.
const intervals=new Set<number>(),setWindowInterval=window.setInterval.bind(window);
window.setInterval=((handler:TimerHandler,timeout?:number,...args:unknown[])=>{
  const id=setWindowInterval(handler,timeout,...args);intervals.add(id);return id;
}) as typeof window.setInterval;
afterAll(()=>{for(const id of intervals)window.clearInterval(id);intervals.clear()});

Object.defineProperty(window,'matchMedia',{
  configurable:true,
  value:()=>({
    matches:false,
    media:'',
    onchange:null,
    addListener(){},
    removeListener(){},
    addEventListener(){},
    removeEventListener(){},
    dispatchEvent(){return false}
  })
});
