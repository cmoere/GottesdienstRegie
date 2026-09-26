import {describe,expect,it} from 'vitest';
import {menuItemTypesForSection} from './itemPlacementPolicy';

describe('add-item menu placement',()=>{
  it('keeps standard elements visible while no section is selected',()=>{
    expect(menuItemTypesForSection(undefined)).toEqual(expect.arrayContaining(['content','song','bible','video','audio']));
  });

  it('shows only loop elements for a mandatory loop section',()=>{
    const types=menuItemTypesForSection({id:'pre',title:'VORPROGRAMM',order:0,type:'preProgram',autoLoop:true,supportsLoopItems:true});
    expect(types).toContain('weather');
    expect(types).not.toContain('song');
  });
});
