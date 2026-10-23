import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {prepareAnnouncementPages,ANNOUNCEMENT_DESIGNS} from './announcementDesign';
import {buildAnnouncementSlide} from './announcementLive';
import {createServiceItem} from './store';
import {SlideRenderer} from './SlideRenderer';
afterEach(cleanup);
it('reserves room above every individual announcement title and keeps the complete body, QR and all eight designs',()=>{
 for(const design of ANNOUNCEMENT_DESIGNS){
  const page=prepareAnnouncementPages({title:'Eigener Meldungstitel',body:'<strong>Wichtiger Text</strong>',qrCode:true,design})[0];
  expect(page.titleElement.y).toBeGreaterThanOrEqual(156);expect(page.bodyElement.y).toBeGreaterThanOrEqual(156);
  const slide=buildAnnouncementSlide(createServiceItem('announcement').slides[0],{title:'Eigener Meldungstitel',text:'Wichtiger Text',durationMs:20000,qrReference:'https://pgbielefeld.neocities.org/meldungen#abc'},page,0,1);
  const label=slide.elements.find(element=>element.name==='Aktuelle Infos');expect(label?.properties.text).toBe('Aktuelle Infos');expect(label?.properties.color).toBe('#ffffff');expect(label!.y+label!.height).toBeLessThan(page.titleElement.y);expect(label!.zIndex).toBeGreaterThan(slide.elements.find(element=>element.name==='Info-Kopf')!.zIndex);expect(slide.elements.some(element=>element.type==='qr')).toBe(true);
 }
});
it('renders the reference header and retains the actual message title below it',()=>{
 const page=prepareAnnouncementPages({title:'Gottesdienst am Sonntag',body:'Bitte beachten.',qrCode:false,design:'light'})[0];const slide=buildAnnouncementSlide(createServiceItem('announcement').slides[0],{title:'Gottesdienst am Sonntag',text:'Bitte beachten.',durationMs:20000},page,0,1);
 render(<SlideRenderer slide={slide} mode="preview"/>);expect(screen.getByText('Aktuelle Infos')).toBeInTheDocument();expect(screen.getByText('Gottesdienst am Sonntag')).toBeInTheDocument();
});
