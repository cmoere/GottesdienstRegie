import{expect,it}from'vitest';import{WeatherWarningSession}from'./session';
const time=Date.parse('2026-10-24T01:00:00Z');const warning={id:'one',event:'Wind',headline:'Windwarnung',description:'Originaltext',severity:'Minor' as const,areaName:'Bielefeld',source:'DWD' as const,validFrom:'2026-10-24T00:00:00Z',validUntil:'2026-10-24T02:00:00Z'};
it('freezes visible notice until its reading boundary and clears immediately for service or expired data',()=>{
 const session=new WeatherWarningSession();const one={status:'ready' as const,fetchedAt:time,warnings:[warning]};
 const first=session.update(one,true,time)!;
 expect(session.update({...one,warnings:[{...warning,headline:'Geändert'}]},true,time+1000)?.items[0].headline).toBe('Windwarnung');
 expect(session.update({...one,warnings:[{...warning,headline:'Geändert'}]},true,time+20001)?.items[0].headline).toBe('Geändert');
 expect(session.update(one,false,time+20002)).toBeNull();expect(session.update(one,true,time+120001)).toBeNull();expect(first.cycleStartedAtMs).toBe(time);
});
