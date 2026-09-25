import {describe,expect,it} from 'vitest';import {reduceQuickOverlay} from './quickOverlayState';
const bible={id:'b',type:'bible',name:'Joh 3,16',enabled:true,targets:['main'],order:0} as const;
describe('quick overlay isolation',()=>{it('keeps Bible visible while slides advance',()=>{const shown=reduceQuickOverlay({visibleQuick:null,normalSnapshot:'A'},{type:'SHOW_QUICK',quick:bible as any,normalSnapshot:'A'});const advanced=reduceQuickOverlay(shown,{type:'UPDATE_NORMAL_SNAPSHOT',snapshot:'B'});expect(advanced.visibleQuick).toEqual(bible);expect(advanced.normalSnapshot).toBe('B')});});
