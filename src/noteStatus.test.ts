import {describe,expect,it} from 'vitest';
import * as noteStatus from './noteStatus';

describe('noteStatusPresentation',()=>{
  it('uses a lock only for the private idle state',()=>{
    expect((noteStatus as any).noteStatusPresentation('idle',0)).toEqual({
      icon:'lock',
      text:'Diese Notiz ist nur für dich sichtbar.',
      animated:false
    });
  });

  it('uses a rotating sync state with one to three dots while saving',()=>{
    expect((noteStatus as any).noteStatusPresentation('saving',1)).toEqual({icon:'sync',text:'Speichert .',animated:true});
    expect((noteStatus as any).noteStatusPresentation('saving',2).text).toBe('Speichert ..');
    expect((noteStatus as any).noteStatusPresentation('saving',3).text).toBe('Speichert ...');
    expect((noteStatus as any).noteStatusPresentation('saving',4).text).toBe('Speichert ...');
  });

  it('uses distinct success and error symbols',()=>{
    expect((noteStatus as any).noteStatusPresentation('saved',0)).toEqual({icon:'check_circle',text:'Gespeichert',animated:false});
    expect((noteStatus as any).noteStatusPresentation('error',0)).toEqual({icon:'error',text:'Speichern fehlgeschlagen',animated:false});
  });
});
