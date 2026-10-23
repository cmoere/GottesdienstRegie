import {describe,it,expect} from 'vitest';
import {prepareAnnouncementPages,announcementDesign,ANNOUNCEMENT_DESIGNS} from './announcementDesign';

describe('readable announcement layouts',()=>{
 it('uses the available slide width and reserves only the QR column when enabled',()=>{
  for(const design of ANNOUNCEMENT_DESIGNS.filter(value=>value!=='split')){
   const plain=prepareAnnouncementPages({title:'Information',body:'Ein Text',qrCode:false,design})[0];
   if(design==='classic'){
    expect(plain.titleElement.x).toBe(60);
    expect(plain.titleElement.x+plain.titleElement.width).toBe(1860);
    expect(plain.bodyElement.x).toBe(60);
    expect(plain.bodyElement.x+plain.bodyElement.width).toBe(1860);
    const qr=prepareAnnouncementPages({title:'Information',body:'Ein Text',qrCode:true,design})[0];
    expect(qr.bodyElement.x+qr.bodyElement.width).toBe(1860);
    expect(qr.qrElement!.x).toBe(1736);
    expect(qr.qrElement!.x+qr.qrElement!.width).toBe(1896);
    expect(qr.bodyElement.y+qr.bodyElement.height).toBeLessThan(qr.qrElement!.y);
    expect(qr.bodyFontSize).toBe(plain.bodyFontSize);
    continue;
   }
   expect(plain.titleElement.x).toBe(32);
   expect(plain.titleElement.x+plain.titleElement.width).toBe(1888);
   expect(plain.bodyElement.x).toBe(32);
   expect(plain.bodyElement.x+plain.bodyElement.width).toBe(1888);
   const qr=prepareAnnouncementPages({title:'Information',body:'Ein Text',qrCode:true,design})[0];
   expect(qr.bodyElement.x+qr.bodyElement.width).toBe(1576);
   expect(qr.qrElement!.x).toBe(1608);
   expect(qr.qrElement!.x+qr.qrElement!.width).toBe(1888);
   expect(qr.bodyFontSize).toBe(plain.bodyFontSize);
  }
 });
 it('provides eight distinct selectable layouts with safe text geometry and approved palette accents',()=>{
  expect(ANNOUNCEMENT_DESIGNS).toHaveLength(8);
  const pages=ANNOUNCEMENT_DESIGNS.map(design=>prepareAnnouncementPages({title:'<u>Titel</u>',body:'<p><strong>Text</strong></p><p>Absatz</p>',qrCode:true,design})[0]);
  expect(new Set(pages.map(page=>JSON.stringify({background:page.background,decorations:page.decorations,body:page.bodyElement}))).size).toBe(8);
  for(const page of pages){
   if(page.referenceLayout) expect(page.bodyElement.y+page.bodyElement.height).toBeLessThan(page.qrElement!.y);
   else expect(page.bodyElement.x+page.bodyElement.width).toBeLessThan(page.qrElement!.x);
   expect(page.bodyHeight).toBeLessThanOrEqual(page.bodyElement.height);
   expect(page.titleRichLines.flat().some(run=>run.underline)).toBe(true);
   expect(page.bodyRichLines.flat().some(run=>run.bold)).toBe(true);
  }
  const fills=pages.flatMap(page=>page.decorations.map(decoration=>decoration.fill));
  expect(fills).toContain('#699f3e');expect(fills).toContain('#608f9a');expect(fills).toContain('#b6bec3');
 });
 it('preserves a long notice in one scrolling body beside its fixed QR code',()=>{
  const title='Fehlerhafte Abendmahlstermine in der Veranstaltungsauskunft';
  const body='Derzeit werden in der Veranstaltungsauskunft teilweise fehlerhafte Abendmahlstermine angezeigt. Bitte beachte die aktuellen Aushänge sowie den Monatsplan. Diese enthalten die gültigen Termine.\n\nWir arbeiten bereits mit Hochdruck an der Behebung des technischen Fehlers. '.repeat(9);
  const pages=prepareAnnouncementPages({title,body,qrCode:true,design:'classic'});
  expect(pages).toHaveLength(1);
  expect(pages.map(page=>page.bodyText).join('')).toBe(body);
  for(const page of pages){
   expect(page.bodyElement.y).toBeGreaterThanOrEqual(page.titleElement.y+page.titleElement.height);
   expect(page.bodyElement.y+page.bodyElement.height).toBeLessThanOrEqual(1048);
   expect(page.bodyHeight).toBeGreaterThan(page.bodyElement.height);
   expect(page.scrollPlan.distance).toBe(page.bodyHeight-page.bodyElement.height);
   expect(page.scrollPlan.roundTrip).toBe(true);
   expect(page.scrollPlan.minDurationMs).toBe(page.scrollPlan.startPauseMs+2*page.scrollPlan.travelMs+page.scrollPlan.endPauseMs);
   expect(page.titleHeight).toBeLessThanOrEqual(page.titleElement.height);
   expect(page.bodyElement.y+page.bodyElement.height).toBeLessThan(page.qrElement!.y);
  }
 });
 it('falls back to a supported design and gives four distinct output layouts',()=>{
  expect(announcementDesign('unknown')).toBe('classic');
  const pages=['classic','light','accent','split'].map(design=>prepareAnnouncementPages({title:'Aktuelle Information',body:'Herzlich willkommen!',qrCode:false,design})[0]);
  expect(new Set(pages.map(page=>JSON.stringify({background:page.background,decorations:page.decorations,body:page.bodyElement}))).size).toBe(4);
 });
 it('places a small thin separator between title and body in every design',()=>{
  for(const design of ANNOUNCEMENT_DESIGNS){
   const page=prepareAnnouncementPages({title:'Information',body:'Ein Text',qrCode:true,design})[0];
   expect(page.decorations.some(box=>design==='classic'
    ?box.height===2&&box.width===1800&&box.fill==='#000000'&&box.y>=page.titleElement.y+page.titleElement.height&&box.y<page.bodyElement.y
    :design==='split'
    ?box.width===3&&box.x>=page.titleElement.x+page.titleElement.width&&box.x<page.bodyElement.x
    :box.height===3&&box.width<=200&&box.y>=page.titleElement.y+page.titleElement.height&&box.y<page.bodyElement.y)).toBe(true);
  }
 });
 it('scrolls all styled text inside the body viewport without losing formatting',()=>{
  const body='<p><strong>'+('UnunterbrocheneZeichenfolge'.repeat(110))+'</strong></p><ul><li><em>Ende</em></li></ul>';
  for(const design of ANNOUNCEMENT_DESIGNS){
   const pages=prepareAnnouncementPages({title:'<u>Titel</u>',body,qrCode:true,design});
   expect(pages).toHaveLength(1);
   expect(pages.map(page=>page.bodyText).join('')).toBe('UnunterbrocheneZeichenfolge'.repeat(110)+'\n• Ende');
   for(const page of pages){
    const rich=(page as unknown as {bodyRichLines:Array<Array<{text:string;bold?:boolean}>>}).bodyRichLines;
    expect(rich).toBeDefined();
    expect(rich.flat().filter(run=>run.text.includes('Zeichen')).every(run=>run.bold)).toBe(true);
    expect(page.bodyHeight).toBeGreaterThan(page.bodyElement.height);
    expect(page.scrollPlan.minDurationMs).toBeGreaterThan(10000);
   }
  }
 });
});
