import {describe,it,expect} from 'vitest';
import {parseNews,NewsAdapter} from './news';
import {ExternalCache} from './cache';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';

const xml='<rss><channel><item><title>Gemeinde &amp; Stadt</title><link>https://www.westfalen-blatt.de/a</link><description><![CDATA[<p>Erster Absatz.</p><p>Zweiter <b>Text</b>.</p><script>evil()</script>]]></description><enclosure type="image/jpeg" url="https://asc-images.forward-publishing.io/photo.jpg"/></item></channel></rss>';
describe('complete public feed stories',()=>{
 it('extracts only plain description and the feed image candidate',()=>{
  expect(parseNews(xml,'westfalen-blatt')[0]).toMatchObject({description:'Erster Absatz.\nZweiter Text.',imageUrl:'https://asc-images.forward-publishing.io/photo.jpg'});
  expect(parseNews('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>WDR</title><link href="https://www1.wdr.de/a"/><summary>Kurzer Text.</summary><content>Andere Beschreibung.</content></entry></feed>','wdr-owl')[0]).toMatchObject({description:'Kurzer Text.'});
 });
 it('prepares images centrally without forwarding remote URLs and tolerates failed image loading',async()=>{
  const adapter=new NewsAdapter({fetchText:async()=>xml,cache:new ExternalCache(null,()=>1000),now:()=>1000,loadImage:async()=>null} as any);
  const reply=await adapter.load(['westfalen-blatt']);
  expect(reply.status).toBe('ready');
  expect(reply.snapshot?.payload).toMatchObject({entries:[{description:'Erster Absatz.\nZweiter Text.'}]});
  expect(JSON.stringify(reply)).not.toContain('asc-images');
 });
 it('accepts old cache entries but rejects arbitrary public image URLs and oversized descriptions',()=>{
  const base={version:1,key:'news:wdr-owl',revision:'a',fetchedAt:1000,stale:false,payload:{kind:'news',entries:[{id:'one',title:'Titel',source:'wdr-owl',publishedAt:null,url:'https://www1.wdr.de/a'}]}};
  expect(readExternalSnapshot(base,base.key,1000)).not.toBeNull();
  expect(readExternalSnapshot({...base,payload:{...base.payload,entries:[{...base.payload.entries[0],description:'Beschreibung'}]}},base.key,1000)).not.toBeNull();
  for(const fields of [{imageDataUrl:'https://localhost/x'},{imageUrl:'https://localhost/x'},{description:'x'.repeat(10001)}])expect(readExternalSnapshot({...base,payload:{...base.payload,entries:[{...base.payload.entries[0],...fields}]}},base.key,1000)).toBeNull();
 });
});
