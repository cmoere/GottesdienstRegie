import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {AnnouncementBanner} from './AnnouncementBanner';
import {BannerSession} from './announcementBannerSession';
const item={id:'a',text:'Bitte beachten',priority:'normal' as const};
afterEach(cleanup);
it('does not restart text on slide takes and stages edits until the cycle finishes',()=>{
  const session=new BannerSession(),input={items:[item],position:'bottom' as const,allowed:true,enabled:true,takeKey:'s1',nowMs:1000,textWidths:[600],reducedMotion:false};
  const first=session.update(input)!;
  expect(session.update({...input,takeKey:'s2',nowMs:2000})).toEqual(first);
  expect(session.update({...input,items:[{...item,text:'Geändert'}],nowMs:3000})).toEqual(first);
  const next=session.update({...input,items:[{...item,text:'Geändert'}],nowMs:45000})!;
  expect(next.items[0].text).toBe('Geändert');expect(next.cycleStartedAtMs).toBe(45000);
});
it('waits for a safe take to reserve or release space and honors quick priority',()=>{
  const session=new BannerSession(),input={items:[],position:'bottom' as const,allowed:true,enabled:true,takeKey:'s1',nowMs:1000,textWidths:[],reducedMotion:false};
  expect(session.update(input)).toBeNull();expect(session.update({...input,items:[item],textWidths:[600],nowMs:2000})).toBeNull();
  expect(session.update({...input,items:[item],textWidths:[600],takeKey:'s2',nowMs:3000})?.reserved).toBe(true);
  expect(session.update({...input,items:[item],allowed:false,takeKey:'black',nowMs:4000})).toBeNull();
});
it('finishes removed text but never starts it again and cycles multiple messages',()=>{
  const session=new BannerSession(),input={items:[item,{...item,id:'b',text:'Zweite'}],position:'bottom' as const,allowed:true,enabled:true,takeKey:'s1',nowMs:1000,textWidths:[600,200],reducedMotion:false};
  expect(session.update(input)?.items[0].id).toBe('a');
  expect(session.update({...input,items:[input.items[1]],textWidths:[200],nowMs:2000})?.items[0].id).toBe('a');
  expect(session.update({...input,items:[input.items[1]],textWidths:[200],nowMs:45000})?.items[0].id).toBe('b');
});
it.each([false,true])('finishes removed text across a safe take before releasing its reserved band (reduced motion: %s)',reducedMotion=>{
  const session=new BannerSession(),input={items:[item],position:'bottom' as const,allowed:true,enabled:true,takeKey:'s1',nowMs:1000,textWidths:[600],reducedMotion};
  const first=session.update(input)!;
  expect(session.update({...input,items:[],takeKey:'s2',nowMs:2000})).toEqual(first);
  const finished=session.update({...input,items:[],takeKey:'s2',nowMs:50000});
  expect(finished?.reserved).toBe(true);expect(finished?.items).toEqual([]);
  expect(session.update({...input,items:[],takeKey:'s3',nowMs:51000})).toBeNull();
});
it('renders plain text only and uses static readable pieces for reduced motion',()=>{
  const state={revision:1,position:'bottom' as const,items:[{...item,text:'<img src=x onerror=bad()> Hallo & willkommen'}],cycleStartedAtMs:1000,reserved:true};
  const view=render(<AnnouncementBanner state={state} nowMs={1000} reducedMotion/>);
  expect(view.container.querySelector('img')).toBeNull();expect(view.container.textContent).toContain('<img');
  expect(screen.getByRole('marquee')).toHaveAttribute('data-reduced-motion','true');
});
