import{expect,it}from'vitest';import{pointInWarningGeometry,warningEligible,readWeatherWarningState}from'./weatherWarnings';
const polygon={type:'Polygon',coordinates:[[[8,52],[9,52],[9,53],[8,53],[8,52]],[[8.2,52.2],[8.4,52.2],[8.4,52.4],[8.2,52.4],[8.2,52.2]]]};
it('matches boundaries and multipolygons but excludes holes and other regions',()=>{
 expect(pointInWarningGeometry(polygon,8.8,52.8)).toBe(true);expect(pointInWarningGeometry(polygon,8,52)).toBe(true);expect(pointInWarningGeometry(polygon,8.3,52.3)).toBe(false);expect(pointInWarningGeometry(polygon,10,52)).toBe(false);expect(pointInWarningGeometry({type:'MultiPolygon',coordinates:[polygon.coordinates]},8.8,52.8)).toBe(true);
 expect(pointInWarningGeometry({type:'Polygon',coordinates:[polygon.coordinates[0],[[NaN,52],[9,52],[9,53],[NaN,52]]]},8.8,52.8)).toBe(false);
});
it('never interrupts service or emergency screens but allows PRE POST and countdown',()=>{
 const base={onAir:true,liveSection:'service',countdownActive:false,quickType:null};
 expect(warningEligible(base)).toBe(false);for(const liveSection of ['pre','post'])expect(warningEligible({...base,liveSection})).toBe(true);
 expect(warningEligible({...base,countdownActive:true})).toBe(true);expect(warningEligible({...base,quickType:'countdown'})).toBe(true);
 for(const quickType of ['black','screenTest','custom','logo'])expect(warningEligible({...base,liveSection:'pre',quickType})).toBe(false);
 expect(warningEligible({...base,onAir:false,liveSection:'pre'})).toBe(false);expect(readWeatherWarningState({revision:1,token:'secret'})).toBeNull();
});
