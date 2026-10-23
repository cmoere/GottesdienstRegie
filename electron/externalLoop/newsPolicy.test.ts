import{expect,it}from'vitest';import{NewsAdapter}from'./news';
it('legacy WDR requests fetch only WB and never reuse WDR cache rows',async()=>{
 const urls:string[]=[],cacheReads:string[]=[];
 const adapter=new NewsAdapter({now:()=>1000,cache:{read:async key=>{cacheReads.push(key);return null},write:async()=>{}},fetchText:async url=>{urls.push(url);return'<rss><channel><item><title>Aktuell</title><link>https://www.westfalen-blatt.de/bielefeld/a</link></item></channel></rss>'}});
 const result=await adapter.load(['wdr-owl']);
 expect(urls).toHaveLength(1);expect(new URL(urls[0]).hostname).toBe('www.westfalen-blatt.de');expect(cacheReads).toEqual(['news:westfalen-blatt']);
 expect(result.snapshot?.payload).toMatchObject({entries:[{title:'Aktuell',source:'westfalen-blatt'}]});
});
