export interface RadioArtwork{imageUrl:string;album:string}

const normalize=(value:string)=>value.normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLocaleLowerCase();
const escapeQuery=(value:string)=>value.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g,'\\$&');

export class RadioArtworkService{
  private cache=new Map<string,RadioArtwork|null>();
  private inFlight=new Map<string,Promise<RadioArtwork|null>>();
  private queue:Promise<void>=Promise.resolve();
  private lastRequestAt=0;
  constructor(private fetcher:typeof fetch=fetch,private minimumIntervalMs=1000){}
  resolve(title:string,artist:string){
    const key=`${normalize(artist)}|${normalize(title)}`;
    if(!normalize(title)||!normalize(artist))return Promise.resolve(null);
    if(this.cache.has(key))return Promise.resolve(this.cache.get(key)??null);
    const existing=this.inFlight.get(key);if(existing)return existing;
    const task=this.queue.then(()=>this.lookup(title,artist));
    this.queue=task.then(()=>undefined,()=>undefined);
    this.inFlight.set(key,task);
    void task.then(value=>this.cache.set(key,value)).finally(()=>this.inFlight.delete(key));
    return task;
  }
  private async lookup(title:string,artist:string):Promise<RadioArtwork|null>{
    const wait=Math.max(0,this.minimumIntervalMs-(Date.now()-this.lastRequestAt));
    if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
    this.lastRequestAt=Date.now();
    const query=`release:"${escapeQuery(title)}" AND artist:"${escapeQuery(artist)}"`,url=`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
    const response=await this.fetcher(url,{headers:{Accept:'application/json','User-Agent':'GottesdienstRegie/67 (cmoere@users.noreply.github.com)'},signal:AbortSignal.timeout(12000)});
    if(!response.ok)return null;
    const data=await response.json() as any,candidates=(data.releases??[]).filter((entry:any)=>normalize(String(entry.title??''))===normalize(title)&&(entry['artist-credit']??[]).some((credit:any)=>normalize(String(credit.name??credit.artist?.name??''))===normalize(artist))).slice(0,5);
    for(const release of candidates){
      const artworkResponse=await this.fetcher(`https://coverartarchive.org/release/${encodeURIComponent(String(release.id))}`,{headers:{Accept:'application/json','User-Agent':'GottesdienstRegie/67 (cmoere@users.noreply.github.com)'},signal:AbortSignal.timeout(12000)});
      if(!artworkResponse.ok)continue;
      const artwork=await artworkResponse.json() as any,image=(artwork.images??[]).find((entry:any)=>entry.front===true&&entry.approved!==false);let imageUrl=String(image?.thumbnails?.['500']??image?.thumbnails?.['250']??'');
      imageUrl=imageUrl.replace(/^http:\/\/coverartarchive\.org\//i,'https://coverartarchive.org/');
      if(/^https:\/\//i.test(imageUrl))return{imageUrl,album:String(release.title??title)};
    }
    return null;
  }
}
