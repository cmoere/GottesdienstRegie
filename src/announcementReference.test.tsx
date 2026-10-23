import{expect,it}from'vitest';import{prepareAnnouncementPages}from'./announcementDesign';import{buildAnnouncementSlide}from'./announcementLive';import{createServiceItem}from'./store';
it('uses the white reference layout, full-width separator, original logo and a bottom-right QR',()=>{
 const page=prepareAnnouncementPages({title:'PGB: Gemeinde-Bibelabend – Veranstaltungsänderungen',body:'Bitte beachte die Aushänge.',qrCode:true,qrSize:160,design:'classic'})[0];
 expect(page.background).toBe('#ffffff');expect(page.color).toBe('#000000');expect(page.titleFontSize).toBeGreaterThanOrEqual(72);expect(page.bodyFontSize).toBeGreaterThanOrEqual(54);
 expect(page.decorations.some(box=>box.fill==='#000000'&&box.width>=1750&&box.height<=2)).toBe(true);expect(page.qrElement!.y).toBeGreaterThanOrEqual(820);expect(page.bodyElement.y+page.bodyElement.height).toBeLessThan(page.qrElement!.y);
 expect(page.qrElement!.y+page.qrElement!.height).toBeLessThanOrEqual(996); // Keep the mandatory test watermark outside the QR quiet zone.
 const slide=buildAnnouncementSlide(createServiceItem('announcement').slides[0],{title:'Titel',text:'Text',durationMs:20000,qrReference:'https://pgbielefeld.neocities.org/meldungen#id'},page,0,1);
 expect(slide.elements.find(element=>element.name==='Gemeindelogo')?.properties.src).toBeTruthy();expect(slide.elements.find(element=>element.name==='Aktuelle Infos')?.x).toBeLessThan(80);
});
