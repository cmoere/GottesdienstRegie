import {expect,it} from 'vitest';
import {isBannerAllowed,bannerCycleDurationMs} from './announcementBannerModel';
it('uses live section and quick-screen priority rather than editor selection',()=>{
  for(const section of ['pre','post'] as const)expect(isBannerAllowed({liveSection:section,quickType:null,countdownActive:false})).toBe(true);
  expect(isBannerAllowed({liveSection:'service',quickType:null,countdownActive:false})).toBe(false);
  expect(isBannerAllowed({liveSection:'service',quickType:'countdown',countdownActive:true})).toBe(true);
  for(const quick of ['black','logo','bible','amen','custom','empty','noText'])expect(isBannerAllowed({liveSection:'pre',quickType:quick,countdownActive:false})).toBe(false);
});
it('repeats a measured text unit plus64px spacing at60px per second without an empty-screen pause',()=>{
  expect(bannerCycleDurationMs(1920,1920)).toBeCloseTo(33066.6667,3);
  expect(bannerCycleDurationMs(0,0)).toBeCloseTo(1066.6667,3);
  expect(bannerCycleDurationMs(NaN,Infinity)).toBeCloseTo(1066.6667,3);
  expect(bannerCycleDurationMs(12000,1920)).toBeCloseTo(201066.6667,3);
});
