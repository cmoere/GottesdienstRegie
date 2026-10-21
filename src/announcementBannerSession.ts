import type {PublicBannerAnnouncement} from './community/AnnouncementService';
import type {BannerPosition} from './announcementBannerModel';
import {bannerCycleDurationMs} from './announcementBannerModel';
import type {BannerOutputState} from './outputState';
export const bannerRibbonText=(items:PublicBannerAnnouncement[])=>items.map(item=>item.text.trim()).filter(Boolean).join(' · ')+(items.length?' · ':'');
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
  const text=bannerRibbonText(state.items);
  return state.reducedMotion?bannerTextPages(text).reduce((sum,page)=>sum+Math.max(4000,page.length*80),0):bannerCycleDurationMs(state.textWidth??text.length*24,1920);
}
export class BannerSession{
  private active:BannerOutputState|null=null;
  private revision=0;
  private lastTake='';
  private lastCycleIndex=0;
  update(input:{items:PublicBannerAnnouncement[];position:BannerPosition;allowed:boolean;enabled:boolean;takeKey:string;nowMs:number;textWidths:number[];separatorWidth?:number;reducedMotion:boolean}):BannerOutputState|null{
    if(!input.enabled||!input.allowed){this.active=null;this.lastTake='';this.lastCycleIndex=0;return null}
    const safeTake=this.lastTake!==input.takeKey;this.lastTake=input.takeKey;
    if(!this.active&&!safeTake)return null;
    const textWidth=input.items.reduce((sum,item,index)=>sum+(input.textWidths[index]??item.text.length*24)+(input.separatorWidth??32),0);
    if(this.active?.items.length){
      if(safeTake&&this.active.position!==input.position)this.active={...this.active,position:input.position,revision:++this.revision};
      const cycle=Math.floor(Math.max(0,input.nowMs-this.active.cycleStartedAtMs)/bannerDisplayDuration(this.active));
      const crossed=cycle>this.lastCycleIndex;this.lastCycleIndex=cycle;
      if(!crossed)return this.active;
      if(JSON.stringify(this.active.items)===JSON.stringify(input.items)&&this.active.reducedMotion===input.reducedMotion&&this.active.textWidth===textWidth)return this.active;
    }
    if(!input.items.length&&safeTake){this.active=null;return null}
    if(!input.items.length){
      if(this.active?.items.length)this.active={...this.active,items:[],revision:++this.revision};
      return this.active;
    }
    this.active={revision:++this.revision,position:safeTake?input.position:this.active?.position??input.position,items:structuredClone(input.items),cycleStartedAtMs:input.nowMs,reserved:true,textWidth,reducedMotion:input.reducedMotion};
    this.lastCycleIndex=0;
    return this.active;
  }
}
