import {describe,it,expect} from 'vitest';
import {AnnouncementLiveController,announcementPlacement} from './announcementLive';
import {createServiceItem} from './store';

const now=new Date('2026-10-11T10:00:00');
const raw={messageId:'a',titel:'Öffentliche Meldung',textMeldung:'Saaltext',status:'öffentlich',messageScreen:true,internalComment:'Geheim'};
const item=createServiceItem('announcement',{sectionId:'pre',itemCategory:'loop'});
describe('announcement live preparation',()=>{
  it('uses PRE targets for PRE and POST targets for POST',()=>{
    expect(announcementPlacement('pre')).toBe('preLoop');
    expect(announcementPlacement('post')).toBe('postLoop');
  });
  it('replaces empty editor text with a public slide and keeps the active take stable',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([raw]);
    const first=controller.outputForTake(item,item.slides[0],1,now)!;
    expect(first.body).toContain('Saaltext');
    expect(first.elements[0].properties.text).toContain('Öffentliche Meldung');
    expect(JSON.stringify(first)).not.toContain('Geheim');
    controller.setRecords([{...raw,textMeldung:'Aktualisiert'}]);
    expect(controller.outputForTake(item,item.slides[0],1,now)).toEqual(first);
    expect(controller.outputForTake(item,item.slides[0],2,now)?.body).toContain('Aktualisiert');
  });
  it('rotates public messages and skips empty data on the next take',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([raw,{...raw,messageId:'b',titel:'Zweite Meldung'}]);
    expect(controller.outputForTake(item,item.slides[0],1,now)?.title).toBe('Öffentliche Meldung');
    expect(controller.outputForTake(item,item.slides[0],2,now)?.title).toBe('Zweite Meldung');
    controller.setRecords([]);
    expect(controller.hasEligible(item,now)).toBe(false);
    expect(controller.outputForTake(item,item.slides[0],2,now)?.title).toBe('Zweite Meldung');
    expect(controller.outputForTake(item,item.slides[0],3,now)).toBeNull();
  });
  it('renders readable HTML text, a readable background, duration and an actual QR image',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([{...raw,textMeldung:'<p>Hallo &amp; willkommen</p><p>Zweite Zeile</p>',qrCode:true,displayDurationMs:24000}]);
    const output=controller.outputForTake(item,{...item.slides[0],background:'#ffffff'},1,now)!;
    expect(output.elements[0].properties.text).toBe('Öffentliche Meldung\n\nHallo & willkommen\nZweite Zeile');
    expect(output.background).toBe('#18232f');
    expect(output.timing?.durationSeconds).toBe(24);
    expect(output.elements.find(element=>element.type==='qr')?.properties.src).toMatch(/^data:image\/svg\+xml/);
  });
});
