import {describe,expect,it} from 'vitest';
import {menuItemTypesForSection,resolveInsertionSectionId} from './itemPlacementPolicy';

describe('add-item menu placement',()=>{
  it('keeps standard elements visible while no section is selected',()=>{
    expect(menuItemTypesForSection(undefined)).toEqual(expect.arrayContaining(['content','song','bible','video','audio']));
  });

  it('preserves explicit pre and post loop targets without falling back to the selection',()=>{
    expect(resolveInsertionSectionId('pre','service')).toBe('pre');
    expect(resolveInsertionSectionId('post','service')).toBe('post');
    expect(resolveInsertionSectionId('preLoop','service')).toBe('pre');
    expect(resolveInsertionSectionId('postLoop','service')).toBe('post');
  });

  it('shows only loop elements for a mandatory loop section',()=>{
    const types=menuItemTypesForSection({id:'pre',title:'VORPROGRAMM',order:0,type:'preProgram',autoLoop:true,supportsLoopItems:true});
    expect(types).toContain('weather');
    expect(types).not.toContain('song');
  });
});
