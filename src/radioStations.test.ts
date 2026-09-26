import {describe,expect,it,vi} from 'vitest';
import {discoverRadioBrowserHosts,searchRadioStations} from './radioStations';

describe('radio station search',()=>{
  it('uses a fallback server when the first Radio Browser host fails',async()=>{
    const fetcher=vi.fn()
      .mockResolvedValueOnce(new Response('',{status:503}))
      .mockResolvedValueOnce(new Response(JSON.stringify([{stationuuid:'one',name:'Gemeinderadio',url_resolved:'https://radio.example/live',lastcheckok:1,bitrate:128}]),{status:200,headers:{'content-type':'application/json'}}));
    const result=await searchRadioStations('Gemeinde',fetcher as typeof fetch,['https://one.example','https://two.example']);
    expect(result.map(station=>station.name)).toEqual(['Gemeinderadio']);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('discovers current Radio Browser hosts instead of relying on stale names',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify([{name:'de1.api.radio-browser.info'},{name:'de1.api.radio-browser.info'},{name:'us1.api.radio-browser.info'}]),{status:200}));
    await expect(discoverRadioBrowserHosts(fetcher as typeof fetch)).resolves.toEqual(['https://de1.api.radio-browser.info','https://us1.api.radio-browser.info']);
  });
});
