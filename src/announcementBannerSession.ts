import type {PublicBannerAnnouncement} from './community/AnnouncementService';
import type {BannerPosition} from './announcementBannerModel';
import {bannerCycleDurationMs} from './announcementBannerModel';
import type {BannerOutputState} from './outputState';
export function bannerTextPages(text:string):string[]{
  const pages:string[]=[];let page='';
  for(const word of text.split(/\s+/u)){
    if(Array.from(`${page} ${word}`.trim()).length<=38){page=`${page} ${word}`.trim();continue}
    if(page){pages.push(page);page=''}
    const characters=Array.from(word);while(characters.length>38)pages.push(characters.splice(0,38).join(''));page=characters.join('');
  }
  if(page)pages.push(page);return pages.length?pages:[''];
}
export function bannerDisplayDuration(state:BannerOutputState):number{
  const text=state.items[0]?.text??'';
  return state.reducedMotion?bannerTextPages(text).reduce((sum,page)=>sum+Math.max(4000,page.length*80),0):bannerCycleDurationMs(state.textWidth??text.length*24,1920);
}
export class BannerSession{
  private active:BannerOutputState|null=null;
  private revision=0;
  private lastTake='';
  update(input:{items:PublicBannerAnnouncement[];position:BannerPosition;allowed:boolean;enabled:boolean;takeKey:string;nowMs:number;textWidths:number[];reducedMotion:boolean}):BannerOutputState|null{
    if(!input.enabled||!input.allowed){this.active=null;this.lastTake='';return null}
    const safeTake=this.lastTake!==input.takeKey;this.lastTake=input.takeKey;
    if(!this.active&&!safeTake)return null;
    if(!input.items.length&&safeTake){this.active=null;return null}
    if(this.active?.items.length&&input.nowMs<this.active.cycleStartedAtMs+bannerDisplayDuration(this.active)){
      if(safeTake&&this.active.position!==input.position)this.active={...this.active,position:input.position,revision:++this.revision};
      return this.active;
    }
    if(!input.items.length){
      if(this.active?.items.length)this.active={...this.active,items:[],revision:++this.revision};
      return this.active;
    }
    const oldId=this.active?.items[0]?.id,oldIndex=input.items.findIndex(item=>item.id===oldId),index=oldIndex>=0?(oldIndex+1)%input.items.length:0;
    this.active={revision:++this.revision,position:safeTake?input.position:this.active?.position??input.position,items:[structuredClone(input.items[index])],cycleStartedAtMs:input.nowMs,reserved:true,textWidth:input.textWidths[index]??input.items[index].text.length*24,reducedMotion:input.reducedMotion};
    return this.active;
  }
}
