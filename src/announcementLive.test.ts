import {describe,it,expect} from 'vitest';
import {AnnouncementLiveController,announcementPlacement} from './announcementLive';
import {createServiceItem} from './store';

const now=new Date('2026-10-11T10:00:00');
const raw={messageId:'a',titel:'Öffentliche Meldung',textMeldung:'Saaltext',status:'öffentlich',messageScreen:true,internalComment:'Geheim'};
const item=createServiceItem('announcement',{sectionId:'pre',itemCategory:'loop'});
describe('announcement live preparation',()=>{
  it('suppresses locally disabled QR codes on every page and reclaims their body width',()=>{
    const controller=new AnnouncementLiveController(),body='Diese Meldung braucht ausreichend Platz. '.repeat(150);
    controller.setRecords([{...raw,textMeldung:body,qrCode:true}]);
    const local={...item,metadata:{...item.metadata,announcementQrEnabled:false}};
    const collected:string[]=[];
    for(let revision=1;revision<30;revision++){
      const output=controller.outputForTake(local,item.slides[0],revision,now)!;
      expect(output.elements.some(element=>element.type==='qr')).toBe(false);
      expect(output.elements.find(element=>element.name==='Meldungstext')!.width).toBe(1856);
      collected.push(output.body);
      if(!controller.hasContinuation(item.id))break;
    }
    expect(collected.join('')).toBe(body.trim());
  });
  it('applies category, sort and reading duration settings to eligible public messages',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([{...raw,titel:'Zebra',category:'event',priority:'urgent'},{...raw,messageId:'b',titel:'Alpha',category:'event'},{...raw,messageId:'c',titel:'Hidden',category:'technical'},{...raw,messageId:'d',titel:'Private',status:'internal',category:'event',priority:'urgent'}]);
    const local={...item,metadata:{...item.metadata,announcementCategory:'event',announcementPrioritySort:false,announcementReadingSeconds:21}};
    const first=controller.outputForTake(local,item.slides[0],1,now)!;
    expect(first.title).toBe('Alpha');expect(first.timing?.durationSeconds).toBe(21);
    expect(controller.outputForTake(local,item.slides[0],2,now)?.title).toBe('Zebra');
    expect(controller.hasEligible({...item,metadata:{announcementCategory:'community'}},now)).toBe(false);
  });
  it('never enables a source-disabled QR code through the local default',()=>{
    const controller=new AnnouncementLiveController();controller.setRecords([{...raw,qrCode:false}]);
    const output=controller.outputForTake(item,item.slides[0],1,now)!;
    expect(output.elements.some(element=>element.type==='qr')).toBe(false);
  });
  it('accepts a one second duration for a short notice but keeps long-page reading time safe',()=>{
    const controller=new AnnouncementLiveController(),local={...item,metadata:{announcementReadingSeconds:1}};
    controller.setRecords([raw]);
    expect(controller.outputForTake(local,item.slides[0],1,now)!.timing?.durationSeconds).toBe(1);
    controller.setRecords([{...raw,textMeldung:'Vollständig lesbare lange Meldung. '.repeat(100)}]);
    expect(controller.outputForTake(local,item.slides[0],2,now)!.timing!.durationSeconds).toBeGreaterThanOrEqual(12);
  });
  it('finishes every page of a long notice before moving to the next message',()=>{
    const controller=new AnnouncementLiveController(),body='Diese ausführliche öffentliche Meldung muss vollständig lesbar bleiben. '.repeat(65);
    controller.setRecords([{...raw,textMeldung:body,qrCode:true},{...raw,messageId:'b',titel:'Zweite Meldung'}]);
    const pages:string[]=[];
    for(let revision=1;revision<30;revision++){
      const output=controller.outputForTake(item,item.slides[0],revision,now)!;
      if(output.title==='Zweite Meldung')break;
      pages.push(output.body);
    }
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.join('')).toBe(body.trim());
  });
  it('uses PRE targets for PRE and POST targets for POST',()=>{
    expect(announcementPlacement('pre')).toBe('preLoop');
    expect(announcementPlacement('post')).toBe('postLoop');
  });
  it('replaces empty editor text with a public slide and keeps the active take stable',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([raw]);
    const first=controller.outputForTake(item,item.slides[0],1,now)!;
    expect(first.body).toContain('Saaltext');
    expect(first.elements.find(element=>element.name==='Meldungstitel')?.properties.text).toContain('Öffentliche Meldung');
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
    expect(output.elements.find(element=>element.name==='Meldungstitel')?.properties.text).toBe('Öffentliche Meldung');
    expect(output.elements.find(element=>element.name==='Meldungstext')?.properties.text).toBe('Hallo & willkommen\nZweite Zeile');
    expect(output.background).toBe('#18232f');
    expect(output.timing?.durationSeconds).toBe(24);
    expect(output.elements.find(element=>element.type==='qr')?.properties.src).toMatch(/^data:image\/svg\+xml/);
  });
  it('keeps safe formatting and list labels in the public frozen slide',()=>{
    const controller=new AnnouncementLiveController();
    controller.setRecords([{...raw,textMeldung:'<p><strong>Bold</strong> <em>Italic</em> <u>Under</u></p><ol><li>First</li><li>Second</li></ol><script>secretScript()</script><img src=x onerror=alert(1)>'}]);
    const output=controller.outputForTake(item,item.slides[0],1,now)!;
    const properties=output.elements.find(element=>element.name==='Meldungstext')!.properties;
    expect(properties.fontFamily).toBe('Cera Pro');
    expect(JSON.parse(String(properties.announcementRichLines))).toEqual([
      [{text:'Bold',bold:true},{text:' '},{text:'Italic',italic:true},{text:' '},{text:'Under',underline:true}],
      [{text:'1. First'}], [{text:'2. Second'}],
    ]);
    expect(output.body).toBe('Bold Italic Under\n1. First\n2. Second');
    expect(JSON.stringify(output)).not.toMatch(/secretScript|onerror|<img/);
  });
});
