import {describe,expect,it} from 'vitest';
import {AnnouncementService} from './AnnouncementService';

const now=new Date('2026-10-04T10:00:00');
const base={messageId:'-Omsg',titel:'Willkommen',beschreibung:'Beschreibung',status:'öffentlich',messageScreen:true,giltAb:'2026-10-04T09:00:00',giltBis:'Bis auf Weiteres',gottesdienstRegie:{enabled:true,loopTargets:{preLoop:true}}};

describe('AnnouncementService',()=>{
  const service=new AnnouncementService();

  it('uses screen validity rules and the preferred public text',()=>{
    const result=service.getForPlacement([{...base,textMeldung:'Saaltext',internalComment:'geheim',createdBy:'admin'}],now,'preLoop');
    expect(result).toEqual([expect.objectContaining({id:'-Omsg',title:'Willkommen',text:'Saaltext'})]);
    expect(result[0]).not.toHaveProperty('internalComment');
    expect(result[0]).not.toHaveProperty('createdBy');
  });

  it('uses showFrom only when saalscreenUseShowFrom is enabled',()=>{
    const future='2026-10-04T11:00:00';
    expect(service.getForPlacement([{...base,showFrom:future,saalscreenUseShowFrom:false}],now,'preLoop')).toHaveLength(1);
    expect(service.getForPlacement([{...base,showFrom:future,saalscreenUseShowFrom:true}],now,'preLoop')).toHaveLength(0);
  });

  it('keeps PRE and POST targets separate and requires explicit enablement',()=>{
    const post={...base,messageId:'post',gottesdienstRegie:{enabled:true,loopTargets:{postLoop:true}}};
    const unassigned={...base,messageId:'none',gottesdienstRegie:undefined};
    expect(service.getForPlacement([base,post,unassigned],now,'preLoop').map(item=>item.id)).toEqual(['-Omsg']);
    expect(service.getForPlacement([base,post,unassigned],now,'postLoop').map(item=>item.id)).toEqual(['post']);
  });

  it('rejects trash, non-public, disabled screen and expired messages',()=>{
    const values=[{...base,trash:true},{...base,status:'intern'},{...base,messageScreen:false},{...base,giltBis:'2026-10-04T09:30:00'}];
    expect(values.every(value=>service.getForPlacement([value],now,'preLoop').length===0)).toBe(true);
  });

  it('retains the message id as QR reference',()=>{
    expect(service.getForPlacement([{...base,qrCode:true}],now,'preLoop')[0]).toMatchObject({id:'-Omsg',qrCode:true,qrReference:'-Omsg'});
  });

  it('accepts compatible public and truthy values and sanitizes the fallback text',()=>{
    const result=service.getForPlacement([{...base,status:'freigegeben',messageScreen:'1',textMeldung:'',beschreibung:'Hallo <script>bad()</script>Welt',gottesdienstRegie:{enabled:'ja',loopTargets:{preLoop:1}}}],now,'preLoop');
    expect(result).toEqual([expect.objectContaining({id:'-Omsg',text:'Hallo Welt'})]);
  });

  it('rejects an invalid date range and yields EMPTY data',()=>{
    expect(service.getForPlacement([{...base,giltAb:'2026-10-05',giltBis:'2026-10-04'}],now,'preLoop')).toEqual([]);
  });
});
