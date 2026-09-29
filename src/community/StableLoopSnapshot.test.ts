import {describe,expect,it} from 'vitest';
import {StableLoopSnapshot} from './StableLoopSnapshot';

describe('StableLoopSnapshot',()=>{
  it('activates updates only at a safe boundary',()=>{
    const snapshot=new StableLoopSnapshot([{id:'a',title:'Alt'}]);
    expect(snapshot.beginDisplay('a')).toEqual({id:'a',title:'Alt'});
    snapshot.prepare([{id:'a',title:'Neu'},{id:'b',title:'Zwei'}]);
    expect(snapshot.current()).toEqual([{id:'a',title:'Alt'}]);
    snapshot.completeDisplay();
    expect(snapshot.current()).toEqual([{id:'a',title:'Neu'},{id:'b',title:'Zwei'}]);
  });

  it('keeps a deleted visible item until completion and never selects it again',()=>{
    const snapshot=new StableLoopSnapshot([{id:'a'},{id:'b'}]);
    expect(snapshot.beginDisplay('a')).toEqual({id:'a'});
    snapshot.prepare([{id:'b'}]);
    expect(snapshot.visible()).toEqual({id:'a'});
    snapshot.completeDisplay();
    expect(snapshot.visible()).toBeNull();
    expect(snapshot.beginDisplay('a')).toBeNull();
  });

  it('reports EMPTY for zero valid records',()=>{
    const snapshot=new StableLoopSnapshot<{id:string}>();
    snapshot.prepare([]);
    expect(snapshot.isEmpty).toBe(true);
  });
});
