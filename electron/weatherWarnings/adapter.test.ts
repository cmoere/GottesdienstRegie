import{expect,it}from'vitest';import{WeatherWarningAdapter}from'./adapter';
const now=Date.parse('2026-10-24T01:00:00Z'),place={name:'Bielefeld',latitude:52.5,longitude:8.5};
const feature=(patch={})=>({geometry:{type:'Polygon',coordinates:[[[8,52],[9,52],[9,53],[8,53],[8,52]]]},properties:{IDENTIFIER:'dwd1',STATUS:'Actual',MSGTYPE:'Alert',SCOPE:'Public',LANGUAGE:'de-DE',EVENT:'WIND',HEADLINE:'Warnung vor Wind',DESCRIPTION:'Originaltext',INSTRUCTION:'Gegenstände sichern.',NAME:'Bielefeld',EFFECTIVE:'2026-10-24T00:00:00Z',ONSET:'2026-10-24T02:00:00Z',EXPIRES:'2026-10-24T06:00:00Z',SEVERITY:'Minor',SENT:'2026-10-24T00:00:00Z',internalComment:'secret',...patch}});
it('queries fixed DWD hosts with WFS native axis order and emits only geographic public notices',async()=>{
 let url='';const service=new WeatherWarningAdapter(async value=>{url=value;return JSON.stringify({type:'FeatureCollection',numberMatched:2,features:[feature(),feature({IDENTIFIER:'cancelled',MSGTYPE:'Cancel'})]})},()=>now);
 const result=await service.load(place);expect(new URL(url).hostname).toBe('maps.dwd.de');expect(new URL(url).searchParams.get('CQL_FILTER')).toContain('POINT(52.5 8.5)');
 expect(result.status).toBe('ready');expect(result.warnings).toHaveLength(1);expect(result.warnings[0]).toMatchObject({id:'dwd1',event:'WIND',description:'Originaltext',source:'DWD'});expect(JSON.stringify(result)).not.toContain('secret');
});
it('rejects expired/future-effective/test/foreign-language notices and stale network cache, never claims all-clear on failure',async()=>{
 let clock=now,offline=false;const service=new WeatherWarningAdapter(async()=>{if(offline)throw Error('network');return JSON.stringify({type:'FeatureCollection',numberMatched:4,features:[feature(),feature({IDENTIFIER:'expired',EXPIRES:'2026-10-24T01:00:00Z'}),feature({IDENTIFIER:'test',STATUS:'Test'}),feature({IDENTIFIER:'future',EFFECTIVE:'2026-10-24T05:00:00Z'})]})},()=>clock);
 expect((await service.load(place)).warnings).toHaveLength(1);offline=true;clock+=61000;expect((await service.load(place)).status).toBe('stale');clock+=120001;expect(await service.load(place)).toMatchObject({status:'unavailable',warnings:[]});
});
it('does not mistake malformed geometry for a valid all-clear and honors cancellation of the same notice',async()=>{
 const invalid=new WeatherWarningAdapter(async()=>JSON.stringify({type:'FeatureCollection',numberMatched:1,features:[{...feature(),geometry:{type:'Polygon',coordinates:[]}}]}),()=>now);
 expect((await invalid.load(place)).status).toBe('unavailable');
 const cancelled=new WeatherWarningAdapter(async()=>JSON.stringify({type:'FeatureCollection',numberMatched:2,features:[feature(),feature({MSGTYPE:'Cancel'})]}),()=>now);
 expect((await cancelled.load(place)).warnings).toEqual([]);
});
