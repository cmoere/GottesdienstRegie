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

  it('keeps explicit PRE and POST targets separate while accepting ordinary screen messages',()=>{
    const post={...base,messageId:'post',gottesdienstRegie:{enabled:true,loopTargets:{postLoop:true}}};
    const unassigned={...base,messageId:'none',gottesdienstRegie:undefined};
    expect(service.getForPlacement([base,post,unassigned],now,'preLoop').map(item=>item.id)).toEqual(['-Omsg','none']);
    expect(service.getForPlacement([base,post,unassigned],now,'postLoop').map(item=>item.id)).toEqual(['post','none']);
  });

  it('honors opt-out and optional target restrictions independently',()=>{
    expect(service.getForPlacement([{...base,gottesdienstRegie:{enabled:false}}],now,'preLoop')).toEqual([]);
    expect(service.getForPlacement([{...base,gottesdienstRegie:{enabled:true}}],now,'postLoop')).toHaveLength(1);
    expect(service.getForPlacement([{...base,gottesdienstRegie:{loopTargets:{postLoop:true}}}],now,'postLoop')).toHaveLength(1);
    expect(service.getForPlacement([{...base,gottesdienstRegie:{loopTargets:{}}}],now,'postLoop')).toEqual([]);
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

describe('independent announcement banner channel',()=>{
  const service=new AnnouncementService(),banner={...base,showMeldungBanner:true,textBanner:'Bannertext'};
  it('accepts banner-only messages without enabling ordinary slides',()=>{
    const record={...banner,messageScreen:false,gottesdienstRegie:{loopTargets:{}}};
    expect(service.getBanners([record],now)).toEqual([expect.objectContaining({text:'Bannertext',id:'-Omsg'})]);
    expect(service.getForPlacement([record],now,'preLoop')).toEqual([]);
    expect(service.getBanners([base],now)).toEqual([]);
  });
  it('rejects private, trashed, disabled, future and expired banners',()=>{
    for(const patch of [{status:'intern'},{trash:'1'},{showMeldungBanner:false},{gottesdienstRegie:{enabled:false}},{giltAb:'2026-10-04T11:00:00'},{giltBis:'2026-10-04T09:00:00'},{saalscreenUseShowFrom:true,showFrom:'2026-10-05'}])expect(service.getBanners([{...banner,...patch}],now)).toEqual([]);
    expect(service.getBanners([{...banner,giltBis:now.toISOString()}],now)).toHaveLength(1);
    expect(service.getBanners([{...banner,giltBis:now.toISOString()}],new Date(now.getTime()+1))).toEqual([]);
  });
  it('chooses the first meaningful text and exposes no private fields or executable markup',()=>{
    const record={...banner,textBanner:'<script>bad()</script> &nbsp;',textLaufbanner:'<p>Bitte <b>beachten</b> &amp; weitersagen.</p>',internalComment:'secret',createdBy:'admin'};
    expect(service.getBanners([record],now)[0]).toEqual({id:'-Omsg',text:'Bitte beachten & weitersagen.',priority:'normal',validFrom:new Date(base.giltAb).toISOString(),validUntil:undefined});
    expect(service.getBanners([{...banner,titel:'',beschreibung:'',textBanner:'<br>&nbsp;'}],now)).toEqual([]);
  });
  it('orders priority first with stable id ties',()=>{
    const records=[{...banner,messageId:'z'},{...banner,messageId:'a'},{...banner,messageId:'urgent',priority:'urgent'}];
    expect(service.getBanners(records,now).map(i=>i.id)).toEqual(['urgent','a','z']);
  });
});
