import {afterEach,expect,it} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {AnnouncementBanner} from './AnnouncementBanner';
import {BannerSession} from './announcementBannerSession';
import {isBannerAllowed} from './announcementBannerModel';
import {bannerDisplayDuration} from './announcementBannerSession';
afterEach(cleanup);
const messages=[{id:'a',text:'Erste Meldung',priority:'normal' as const},{id:'b',text:'Zweite Meldung',priority:'important' as const}];
it('renders all messages as a repeated continuous ribbon separated by a middle dot',()=>{
 const {container}=render(<AnnouncementBanner state={{revision:1,position:'top',items:messages,cycleStartedAtMs:1000,reserved:true,textWidth:600}} nowMs={1000} reducedMotion={false}/>);
 expect(container.textContent).toContain('Zweite Meldung');
 const units=container.querySelectorAll('[data-banner-unit]');expect(units.length).toBeGreaterThanOrEqual(3);
 expect(units[0].textContent).toContain(' · ');expect(units[0].textContent).toContain('Erste Meldung');
 expect(container.querySelector('[data-banner-track]')?.getAttribute('style')).toContain('translateX(0');
});
it('retains its clock through countdown takes and after complete unchanged cycles',()=>{
 const session=new BannerSession(),input={items:messages,position:'bottom' as const,allowed:true,enabled:true,takeKey:'pre',nowMs:1000,textWidths:[300,300],reducedMotion:false};
 const first=session.update(input)!;expect(first.items).toEqual(messages);
 expect(session.update({...input,takeKey:'countdown',nowMs:2000})?.cycleStartedAtMs).toBe(1000);
 expect(session.update({...input,takeKey:'countdown',nowMs:120000})?.cycleStartedAtMs).toBe(1000);
});
it('allows the arrival period without clearing the banner clock',()=>{
 expect(isBannerAllowed({liveSection:'warmup',quickType:null,countdownActive:false} as any)).toBe(true);
});
it('repeats reduced-motion text pages instead of getting stuck on the last one',()=>{
 const state={revision:1,position:'top' as const,items:[{...messages[0],text:'Erste Meldung mit wichtigen Informationen für alle Besucher'},{...messages[1],text:'Zweite Meldung mit weiteren aktuellen Terminen'}],cycleStartedAtMs:1000,reserved:true,textWidth:600,reducedMotion:true};
 const view=render(<AnnouncementBanner state={state} nowMs={1000} reducedMotion/>);
 const first=view.container.textContent;
 view.rerender(<AnnouncementBanner state={state} nowMs={1000+bannerDisplayDuration(state)} reducedMotion/>);
 expect(view.container.textContent).toBe(first);
});
it('adopts corrected font measurements at a cycle boundary',()=>{
 const session=new BannerSession(),input={items:messages,position:'bottom' as const,allowed:true,enabled:true,takeKey:'pre',nowMs:1000,textWidths:[10,10],separatorWidth:0,reducedMotion:false};
 expect(session.update(input)?.textWidth).toBe(20);
 expect(session.update({...input,nowMs:100000,textWidths:[300,300]})?.textWidth).toBe(600);
});
