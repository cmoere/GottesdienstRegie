import {beforeEach,describe,expect,it} from 'vitest';
import {usePresentation as useStore} from './store';

describe('mandatory pre and post loops',()=>{
  beforeEach(()=>useStore.getState().newDocument('Loop-Test'));

  it('creates both pre and post program as permanent loops',()=>{
    const sections=useStore.getState().sections;
    for(const id of ['pre','post']){
      const section=sections.find(entry=>entry.id===id);
      expect(section?.autoLoop).toBe(true);
      expect(section?.supportsLoopItems).toBe(true);
    }
  });

  it('does not allow disabling the permanent loops',()=>{
    useStore.getState().updateSection('pre',{autoLoop:false,supportsLoopItems:false});
    useStore.getState().updateSection('post',{autoLoop:false,supportsLoopItems:false});
    for(const id of ['pre','post']){
      const section=useStore.getState().sections.find(entry=>entry.id===id);
      expect(section?.autoLoop).toBe(true);
      expect(section?.supportsLoopItems).toBe(true);
    }
  });
});
