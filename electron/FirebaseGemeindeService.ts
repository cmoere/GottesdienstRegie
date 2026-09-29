export type RawCommunityRecord=Record<string,unknown>;
export type RawChurchEvent=RawCommunityRecord&{eventKey:string};
export type RawAnnouncement=RawCommunityRecord&{messageId:string};
import type {CommunitySnapshotCache} from './CommunitySnapshotCache';
export type CommunityConnectionState={connected:boolean;mode:'online'|'offline-cache'|'empty'|'error';updatedAt:number};

export interface CommunityRealtimeAdapter{
  watchCollection(path:'veranstaltungen',listener:(rows:Record<string,unknown>)=>void):()=>void;
  watchChildren(path:'meldungen',handlers:{added:(key:string,value:unknown)=>void;changed:(key:string,value:unknown)=>void;removed:(key:string)=>void}):()=>void;
  watchConnection(listener:(connected:boolean)=>void):()=>void;
  updateEvent?(eventKey:string,patch:Record<string,unknown>):Promise<void>;
}

type Listener<T>=(value:readonly T[])=>void;

export class FirebaseGemeindeService{
  private events:RawChurchEvent[]=[];
  private announcements=new Map<string,RawAnnouncement>();
  private eventListeners=new Set<Listener<RawChurchEvent>>();
  private announcementListeners=new Set<Listener<RawAnnouncement>>();
  private connectionListeners=new Set<(state:CommunityConnectionState)=>void>();
  private stopEvents?:()=>void;
  private stopAnnouncements?:()=>void;
  private stopConnection?:()=>void;

  constructor(private readonly adapter:CommunityRealtimeAdapter,private readonly cache?:CommunitySnapshotCache){}
  updateEvent(eventKey:string,patch:Record<string,unknown>){if(!eventKey.trim()||!this.adapter.updateEvent)throw new Error('EVENT_UPDATE_UNAVAILABLE');return this.adapter.updateEvent(eventKey,patch)}

  subscribeEvents(listener:Listener<RawChurchEvent>):()=>void{
    this.eventListeners.add(listener);
    if(!this.stopEvents)this.stopEvents=this.adapter.watchCollection('veranstaltungen',rows=>{
      this.events=Object.entries(rows??{}).flatMap(([eventKey,value])=>value&&typeof value==='object'?[{eventKey,...value as RawCommunityRecord}]:[]);
      this.eventListeners.forEach(next=>next(this.events));
      void this.persist();
    });
    if(this.events.length)listener(this.events);
    return()=>this.eventListeners.delete(listener);
  }

  subscribeAnnouncements(listener:Listener<RawAnnouncement>):()=>void{
    this.announcementListeners.add(listener);
    if(!this.stopAnnouncements)this.stopAnnouncements=this.adapter.watchChildren('meldungen',{
      added:(messageId,value)=>this.upsertAnnouncement(messageId,value),
      changed:(messageId,value)=>this.upsertAnnouncement(messageId,value),
      removed:messageId=>{this.announcements.delete(messageId);this.publishAnnouncements()},
    });
    if(this.announcements.size)listener([...this.announcements.values()]);
    return()=>this.announcementListeners.delete(listener);
  }

  subscribeConnection(listener:(state:CommunityConnectionState)=>void):()=>void{
    this.connectionListeners.add(listener);
    if(!this.stopConnection)this.stopConnection=this.adapter.watchConnection(connected=>{
      if(connected){this.publishConnection({connected:true,mode:'online',updatedAt:Date.now()});void this.persist();return;}
      void this.restoreCache();
    });
    return()=>this.connectionListeners.delete(listener);
  }

  dispose(){this.stopEvents?.();this.stopAnnouncements?.();this.stopConnection?.();this.stopEvents=this.stopAnnouncements=this.stopConnection=undefined;this.eventListeners.clear();this.announcementListeners.clear();this.connectionListeners.clear()}

  private upsertAnnouncement(messageId:string,value:unknown){
    if(value&&typeof value==='object')this.announcements.set(messageId,{messageId,...value as RawCommunityRecord});
    this.publishAnnouncements();
  }
  private publishAnnouncements(){const values=[...this.announcements.values()];this.announcementListeners.forEach(next=>next(values))}
  private publishConnection(state:CommunityConnectionState){this.connectionListeners.forEach(next=>next(state))}
  private async persist(){if(this.cache)await this.cache.write({events:this.events,announcements:[...this.announcements.values()]})}
  private async restoreCache(){
    if(!this.cache){this.publishConnection({connected:false,mode:'empty',updatedAt:Date.now()});return}
    const snapshot=await this.cache.read(record=>this.isStillValid(record));
    if(!this.events.length&&snapshot.events.length){this.events=snapshot.events;this.eventListeners.forEach(next=>next(this.events))}
    if(!this.announcements.size&&snapshot.announcements.length){this.announcements=new Map(snapshot.announcements.map(item=>[item.messageId,item]));this.publishAnnouncements()}
    this.publishConnection({connected:false,mode:snapshot.mode,updatedAt:snapshot.updatedAt??Date.now()});
  }
  private isStillValid(record:RawChurchEvent|RawAnnouncement){
    if(record.trash===true)return false;
    const raw=('messageId'in record?record.giltBis:record.Verspaetungsenddatum??record.ende_datum) as unknown;
    if(!raw||String(raw).trim().toLowerCase()==='bis auf weiteres')return true;
    const date=new Date(String(raw));return Number.isNaN(date.getTime())||date.getTime()>=Date.now();
  }
}

export async function createCommunityRealtimeAdapter():Promise<CommunityRealtimeAdapter>{
  const [{getApp,getApps,initializeApp},{getDatabase,onChildAdded,onChildChanged,onChildRemoved,onValue,ref,update}]=await Promise.all([import('firebase/app'),import('firebase/database')]);
  const name='gottesdienstregie-community-main';
  const app=getApps().find(entry=>entry.name===name)??initializeApp({apiKey:'AIzaSyB0fmfjqC8aPyOEZxLjk1TfQal_s5xZFAM',authDomain:'philippusgemeindebie.firebaseapp.com',databaseURL:'https://philippusgemeindebie-default-rtdb.europe-west1.firebasedatabase.app',projectId:'philippusgemeindebie',storageBucket:'philippusgemeindebie.firebasestorage.app',messagingSenderId:'429968461937',appId:'1:429968461937:web:3c0f654404ec5d0e24cbd0'},name);
  const database=getDatabase(getApp(name)??app);
  return{
    watchCollection:(path,listener)=>onValue(ref(database,path),snapshot=>listener(snapshot.val()??{})),
    watchChildren:(path,handlers)=>{const target=ref(database,path),stops=[onChildAdded(target,snapshot=>handlers.added(snapshot.key!,snapshot.val())),onChildChanged(target,snapshot=>handlers.changed(snapshot.key!,snapshot.val())),onChildRemoved(target,snapshot=>handlers.removed(snapshot.key!))];return()=>stops.forEach(stop=>stop())},
    watchConnection:listener=>onValue(ref(database,'.info/connected'),snapshot=>listener(snapshot.val()===true)),
    updateEvent:async(eventKey,patch)=>{await update(ref(database,`veranstaltungen/${eventKey}`),patch)},
  };
}
