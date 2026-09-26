import {describe,expect,it} from 'vitest';
import {shouldHandlePreviewArrow} from './previewKeyboard';

describe('shouldHandlePreviewArrow',()=>{
  it('accepts horizontal arrows outside editors',()=>{
    expect(shouldHandlePreviewArrow('ArrowRight',document.body)).toBe(true);
    expect(shouldHandlePreviewArrow('ArrowLeft',document.body)).toBe(true);
  });
  it('does not hijack typing or open dialogs',()=>{
    const input=document.createElement('input');
    expect(shouldHandlePreviewArrow('ArrowRight',input)).toBe(false);
    const dialog=document.createElement('div');dialog.setAttribute('role','dialog');document.body.append(dialog);
    expect(shouldHandlePreviewArrow('ArrowRight',document.body)).toBe(false);
    dialog.remove();
  });
});
