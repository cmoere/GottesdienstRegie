import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {prepareAnnouncementPages} from './announcementDesign';
import {AnnouncementLiveController} from './announcementLive';
import {AnnouncementSlideDesigner} from './AnnouncementSlideDesigner';
import {createServiceItem,usePresentation} from './store';
import {AnnouncementScrollingText} from './AnnouncementScrollingText';
import {usePreferences} from './preferences';
afterEach(cleanup);
it('keeps a long formatted message on one top-aligned scrolling surface',()=>{
 const body='<p><b>'+('Lesbarer vollständiger Text. '.repeat(200))+'</b></p>';
 const pages=prepareAnnouncementPages({title:'Wichtig',body,qrCode:true,design:'classic'});
 expect(pages).toHaveLength(1);
 expect(pages[0].titleElement.y).toBeLessThanOrEqual(40);
 expect(pages[0].bodyText).toContain('Lesbarer vollständiger Text. '.repeat(199));
 expect(pages[0].bodyHeight).toBeGreaterThan(pages[0].bodyElement.height);
 expect(pages[0].bodyRichLines.flat().every(run=>run.bold)).toBe(true);
});
it('provides a QR-size control and persists it per announcement element',()=>{
 const item=createServiceItem('announcement',{itemCategory:'loop'});usePresentation.setState({items:[item]});
 render(<AnnouncementSlideDesigner item={item} canEdit/>);
 fireEvent.change(screen.getByLabelText('QR-Code-Größe (Pixel bei 1920 × 1080)'),{target:{value:'360'}});
 expect(usePresentation.getState().items[0].metadata.announcementQrSize).toBe(360);
});
it('prepares a fixed sized QR and enough automatic time to read the entire scroll',()=>{
 const item=createServiceItem('announcement',{itemCategory:'loop',metadata:{announcementQrSize:360,announcementReadingSeconds:1}}),controller=new AnnouncementLiveController();
 controller.setRecords([{messageId:'long',titel:'Hinweis',textMeldung:'Vollständiger Meldungstext. '.repeat(200),status:'public',messageScreen:true,qrCode:true}]);
 const slide=controller.outputForTake(item,item.slides[0],1,new Date())!;
 expect(slide.elements.find(element=>element.type==='qr')?.width).toBe(360);
 expect(slide.timing!.durationSeconds).toBeGreaterThan(60);
 expect(controller.hasContinuation(item.id)).toBe(false);
 expect(slide.body).toContain('Vollständiger Meldungstext. '.repeat(199));
});
it('reserves decorative bottom bands outside the scrolling text viewport',()=>{
 for(const design of ['frame','footer']){
  const page=prepareAnnouncementPages({title:'Hinweis',body:'Text '.repeat(1000),qrCode:false,design})[0];
  const bottom=page.decorations.find(box=>box.y>1000)!;
  expect(page.bodyElement.y+page.bodyElement.height).toBeLessThanOrEqual(bottom.y-16);
 }
});
it('honors the app reduced-motion preference without starting a scrolling animation',()=>{
 const saved=usePreferences.getState().reduceMotion;usePreferences.setState({reduceMotion:true});
 try{
  const view=render(<AnnouncementScrollingText properties={{text:'Vollständiger Text',announcementScrollHeight:2000,announcementViewportHeight:800}} startedAtMs={Date.now()} live/>);
  expect(view.container.querySelector('.event-scroll-viewport')).toBeNull();
  expect(view.container.textContent).toBe('Vollständiger Text');
 }finally{usePreferences.setState({reduceMotion:saved})}
});
