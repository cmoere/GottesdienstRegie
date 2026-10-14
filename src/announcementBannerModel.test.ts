import {expect,it} from 'vitest';
import {isBannerAllowed,bannerCycleDurationMs} from './announcementBannerModel';
it('uses live section and quick-screen priority rather than editor selection',()=>{
  for(const section of ['pre','post'] as const)expect(isBannerAllowed({liveSection:section,quickType:null,countdownActive:false})).toBe(true);
  expect(isBannerAllowed({liveSection:'service',quickType:null,countdownActive:false})).toBe(false);
  expect(isBannerAllowed({liveSection:'service',quickType:'countdown',countdownActive:true})).toBe(true);
  for(const quick of ['black','logo','bible','amen','custom','empty','noText'])expect(isBannerAllowed({liveSection:'pre',quickType:quick,countdownActive:false})).toBe(false);
});
it('allows both reading pauses and the full travel distance at 60 px per second',()=>{
  expect(bannerCycleDurationMs(1920,1920)).toBe(66000);
  expect(bannerCycleDurationMs(0,0)).toBe(2000);
  expect(bannerCycleDurationMs(NaN,Infinity)).toBe(2000);
  expect(bannerCycleDurationMs(12000,1920)).toBe(234000);
});
