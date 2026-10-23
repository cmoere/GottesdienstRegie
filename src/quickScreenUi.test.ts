import {describe,expect,it,vi} from 'vitest';
import {applyQuickScreen} from './quickScreenUi';
import {quickOverridesRoomNotice} from './quickScreenUi';
import type {QuickScreenConfig} from './preferences';
import {normalizeBibleDisplayText,quickScreenShortcut,quickScreenTypeForKey,shouldRenderOperatorQuick} from './quickScreenUi';

describe('quick-screen UI rules',()=>{
  it('shows stable keys for every built-in quick screen',()=>{
    expect(quickScreenShortcut('logo')).toBe('F2');
    expect(quickScreenShortcut('bible')).toBe('F9');
    expect(quickScreenTypeForKey('f9')).toBe('bible');
  });
  it('preserves correct German Bible capitalization',()=>{
    expect(normalizeBibleDisplayText('Denn also hat GOtt die Welt geliebt.')).toBe('Denn also hat Gott die Welt geliebt.');
    expect(normalizeBibleDisplayText('GOTT ist gut.')).toBe('GOTT ist gut.');
  });
  it('never renders a Bible quick screen over the editor',()=>{
    expect(shouldRenderOperatorQuick('edit','bible')).toBe(false);
    expect(shouldRenderOperatorQuick('preview','bible')).toBe(true);
  });
});

it('sends Bible page changes without reopening F9, while an empty Bible tile opens the dialog',async()=>{
  const base:QuickScreenConfig={id:'bible',type:'bible',name:'Bibel',enabled:true,targets:['main'],order:0};
  const openBible=vi.fn(),setQuick=vi.fn(),sendQuick=vi.fn().mockResolvedValue(true);
  const actions={openBible,setQuick,sendQuick,onAir:true};
  await applyQuickScreen(base,actions);
  expect(openBible).toHaveBeenCalledTimes(1);expect(sendQuick).not.toHaveBeenCalled();
  const page={...base,id:'passage',pages:[['Vers eins'],['Vers zwei']],pageIndex:1,reference:'Johannes 3,16–17'};
  await applyQuickScreen(page,actions);
  expect(openBible).toHaveBeenCalledTimes(1);expect(setQuick).toHaveBeenLastCalledWith(page);
  expect(sendQuick).toHaveBeenLastCalledWith(['main'],page);
  await applyQuickScreen({...page,pageIndex:0},actions);
  expect(sendQuick).toHaveBeenLastCalledWith(['main'],expect.objectContaining({pageIndex:0}));
  await applyQuickScreen(null,actions);expect(sendQuick).toHaveBeenLastCalledWith(['main'],null);
});

it('prepares a populated Bible off air without opening the dialog or sending it live',async()=>{
  const actions={openBible:vi.fn(),setQuick:vi.fn(),sendQuick:vi.fn(),onAir:false};
  const quick:QuickScreenConfig={id:'passage',type:'bible',name:'Bibel',text:'Ein Vers',enabled:true,targets:['main'],order:0};
  await applyQuickScreen(quick,actions);
  expect(actions.openBible).not.toHaveBeenCalled();expect(actions.setQuick).toHaveBeenCalledWith(quick);expect(actions.sendQuick).not.toHaveBeenCalled();
});
it('limits the new room-notice override to Bildschirmtest and Technische Störung',()=>{
 const base:QuickScreenConfig={id:'normal',type:'custom',name:'Hinweis',enabled:true,targets:['main'],order:0};
 expect(quickOverridesRoomNotice({...base,type:'screenTest'})).toBe(true);
 expect(quickOverridesRoomNotice({...base,id:'technical-issue'})).toBe(true);
 expect(quickOverridesRoomNotice({...base,type:'noText'})).toBe(false);
 expect(quickOverridesRoomNotice(base)).toBe(false);expect(quickOverridesRoomNotice(null)).toBe(false);
});
