import {describe,expect,it} from 'vitest';
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
