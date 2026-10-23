import {afterEach,describe,expect,it} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseNews,NewsAdapter} from './news';
import {ExternalCache} from './cache';

const rss=()=>fs.readFile('tests/fixtures/external-loop/news.xml','utf8');
const atom=()=>fs.readFile('tests/fixtures/external-loop/news-atom.xml','utf8');
const directories:string[]=[];
afterEach(async()=>{for(const dir of directories.splice(0))await fs.rm(dir,{recursive:true,force:true})});
describe('external loop news normalization',()=>{
 it('stripsHtmlAndKeepsSource without forwarding raw feed fields',async()=>{
  const entries=parseNews(await rss(),'westfalen-blatt');
  expect(entries).toMatchObject([{title:'Gottesdienst & Begegnung',source:'westfalen-blatt',publishedAt:'2026-10-22T12:00:00.000Z',url:'https://www.westfalen-blatt.de/owl/bielefeld/begegnung'},{title:'Ohne Datum',publishedAt:null}]);
  expect(Object.keys(entries[0]).sort()).toEqual(['description','id','publishedAt','source','title','url']);
  expect(parseNews(await atom(),'wdr-owl')).toMatchObject([{title:'Gemeinde & Stadt',url:'https://www1.wdr.de/nrw/bielefeld/stadt.html'}]);
 });
 it('rejectsDtdAndOversizedXml and malformed documents',()=>{
  for(const xml of ['<!DOCTYPE rss [<!ENTITY external SYSTEM "file:///private">]><rss/>','x'.repeat(2097153),'<rss><channel></rss>'])expect(()=>parseNews(xml,'wdr-owl')).toThrow();
 });
 it('bounds XML nesting to avoid parser work growing with an attacker-controlled tree',()=>{
  expect(()=>parseNews('<rss>'+('<x>'.repeat(1000))+('</x>'.repeat(1000))+'</rss>','wdr-owl')).toThrow('xml-depth');
 });
 it('does not strip literal mathematical title text',()=>{
  expect(parseNews('<rss><channel><item><title>2 &lt; 3 &gt; 1</title><link>https://www1.wdr.de/a</link></item></channel></rss>','wdr-owl')[0]?.title).toBe('2 < 3 > 1');
 });
 it('limits each source to100entries and never treats nested content as another item',()=>{
  const items=Array.from({length:101},(_,i)=>`<item><title>News ${i}</title><link>https://www1.wdr.de/${i}</link><description><![CDATA[<item><title>fake</title></item>]]></description></item>`).join('');
  expect(parseNews(`<rss><channel>${items}</channel></rss>`,'wdr-owl')).toHaveLength(100);
 });
 it('deduplicatesCanonicalLinks and rejects unsafe article URLs',()=>{
  const xml='<rss><channel><item><title>A</title><link>https://www1.wdr.de/a?utm_source=RSS#fragment</link></item><item><title>A2</title><link>https://www1.wdr.de/a</link></item><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>';
  expect(parseNews(xml,'wdr-owl')).toMatchObject([{title:'A',url:'https://www1.wdr.de/a'}]);
  expect(parseNews(xml,'wdr-owl')).toHaveLength(1);
 });
 it('keepsSuccessfulSourceWhenOtherFails and marks the partial reply stale',async()=>{
  const adapter=new NewsAdapter({fetchText:async url=>{if(url.includes('westfalen-blatt'))return rss();throw Error('offline')},cache:new ExternalCache(null,()=>1000000),now:()=>1000000});
  const result=await adapter.load(['westfalen-blatt','wdr-owl']);
  expect(result.status).toBe('stale');expect(result.snapshot?.payload).toMatchObject({entries:[{title:'Gottesdienst & Begegnung'},{title:'Ohne Datum'}]});
 });
 it('coalescesAndRespectsFiveMinutes including failed-attempt backoff',async()=>{
  let now=1000000,count=0;
  const adapter=new NewsAdapter({fetchText:async()=>{count++;return atom()},cache:new ExternalCache(null,()=>now),now:()=>now});
  const replies=await Promise.all([adapter.load(['wdr-owl']),adapter.load(['wdr-owl'])]);
  expect(replies[0]).toEqual(replies[1]);await adapter.load(['wdr-owl']);expect(count).toBe(1);
  now+=300000;await adapter.load(['wdr-owl']);expect(count).toBe(2);
  let failures=0;const offline=new NewsAdapter({fetchText:async()=>{failures++;throw Error('offline')},cache:new ExternalCache(null,()=>now),now:()=>now});
  expect((await offline.load(['wdr-owl'])).status).toBe('unavailable');await offline.load(['wdr-owl']);expect(failures).toBe(1);
 });
 it('merges newest first and takes ten without inventing unknown dates',async()=>{
  const xml=`<rss><channel>${Array.from({length:12},(_,i)=>`<item><title>News ${i}</title><link>https://www1.wdr.de/${i}</link><pubDate>2026-10-${String(i+1).padStart(2,'0')}T12:00:00Z</pubDate></item>`).join('')}</channel></rss>`;
  const adapter=new NewsAdapter({fetchText:async()=>xml,cache:new ExternalCache(null,()=>1000000),now:()=>1000000});
  const result=await adapter.load(['wdr-owl']);
  expect(result.snapshot?.payload.kind==='news'&&result.snapshot.payload.entries).toHaveLength(10);
  expect(result.snapshot?.payload.kind==='news'&&result.snapshot.payload.entries.map(entry=>entry.title)).toEqual(['News 11','News 10','News 9','News 8','News 7','News 6','News 5','News 4','News 3','News 2']);
 });
 it('uses last valid snapshot on failure, expires it, and survives cache write failure',async()=>{
  let now=1000000,offline=false;const cache=new ExternalCache(null,()=>now);
  const adapter=new NewsAdapter({fetchText:async()=>{if(offline)throw Error('offline');return atom()},cache,now:()=>now});
  await adapter.load(['wdr-owl']);offline=true;now+=300000;
  expect((await adapter.load(['wdr-owl'])).status).toBe('stale');now+=86400001;
  expect((await adapter.load(['wdr-owl'])).snapshot).toBeNull();
  const unwritable=new NewsAdapter({fetchText:atom,cache:{read:async()=>null,write:async()=>{throw Error('disk')}},now:()=>now});
  expect((await unwritable.load(['wdr-owl'])).status).toBe('ready');
 });
 it('does not start a network request after disposal while a cache read was pending',async()=>{
  let resolveCache:(value:null)=>void=()=>{},networkRequests=0;
  const adapter=new NewsAdapter({fetchText:async()=>{networkRequests++;return atom()},cache:{read:()=>new Promise(resolve=>{resolveCache=resolve}),write:async()=>{}}});
  const pending=adapter.load(['wdr-owl']);adapter.dispose();resolveCache(null);
  expect(await pending).toEqual({snapshot:null,status:'unavailable'});expect(networkRequests).toBe(0);
 });
 it('removes expired persisted news even when the adapter has stayed alive offline',async()=>{
  let now=1000000,offline=false;const directory=await fs.mkdtemp(path.join(os.tmpdir(),'regie-news-retention-'));directories.push(directory);
  const adapter=new NewsAdapter({fetchText:async()=>{if(offline)throw Error('offline');return atom()},cache:new ExternalCache(directory,()=>now),now:()=>now});
  await adapter.load(['wdr-owl']);expect(await fs.readdir(directory)).toHaveLength(1);
  offline=true;now+=86400001;expect((await adapter.load(['wdr-owl'])).snapshot).toBeNull();
  expect(await fs.readdir(directory)).toEqual([]);
 });
});
