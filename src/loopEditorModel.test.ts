import {describe,expect,it} from 'vitest';
import {createLoopItem} from './loopItemFactory';
import {usesAutomaticLoopEditor} from './loopEditorModel';

describe('automatic loop editor',()=>{
  it('replaces the generic text editor for data-driven loop elements',()=>{
    for(const type of ['announcement','birthday','event','weather','clock','today','nextEvents','nowPlaying']){
      expect(usesAutomaticLoopEditor(type),type).toBe(true);
    }
  });

  it('keeps content editing for loop elements whose content is entered manually',()=>{
    for(const type of ['loopQuiz','loopCountdown','bibleVerse','loopQr','infoCard']){
      expect(usesAutomaticLoopEditor(type),type).toBe(false);
    }
  });

  it('does not create placeholder copy for the now-playing slide',()=>{
    expect(createLoopItem('nowPlaying','pre').body).toBe('');
  });
});
