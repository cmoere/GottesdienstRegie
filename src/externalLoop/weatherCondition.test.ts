import {describe,it,expect} from 'vitest';
import {weatherCondition,weatherAppearance} from './weatherCondition';
describe('weather interpretation and wind overlay',()=>{
 it.each([[0,'sun'],[1,'partly-cloudy'],[2,'partly-cloudy'],[3,'cloud'],[45,'fog'],[48,'fog'],[51,'drizzle'],[57,'freezing-rain'],[61,'rain'],[67,'freezing-rain'],[71,'snow'],[77,'snow'],[82,'rain'],[85,'snow'],[95,'thunder'],[96,'hail'],[99,'hail'],[-1,'unknown'],[NaN,'unknown'],[4,'unknown']] as const)('maps WMO code %s to %s', (code,kind)=>expect(weatherCondition(code).kind).toBe(kind));
 it('keeps snow and rain visible when the observed wind is strong',()=>{
  expect(weatherAppearance(73,42)).toMatchObject({kind:'snow',windy:true});
  expect(weatherAppearance(65,3)).toMatchObject({kind:'rain',windy:false});
  expect(weatherAppearance(0,NaN)).toMatchObject({kind:'sun',windy:false});
 });
});
