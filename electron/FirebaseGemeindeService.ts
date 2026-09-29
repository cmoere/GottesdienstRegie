export type RawCommunityRecord=Record<string,unknown>;
export type RawChurchEvent=RawCommunityRecord&{eventKey:string};
export type RawAnnouncement=RawCommunityRecord&{messageId:string};
export type CommunityConnectionState={connected:boolean;updatedAt:number};

export interface CommunityRealtimeAdapter{
  watchCollection(path:'veranstaltungen',listener:(rows:Record<string,unknown>)=>void):()=>void;
  watchChildren(path:'meldungen',handlers:{added:(key:string,value:unknown)=>void;changed:(key:string,value:unknown)=>void;removed:(key:string)=>void}):()=>void;
  watchConnection(listener:(connected:boolean)=>void):()=>void;
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

  constructor(private readonly adapter:CommunityRealtimeAdapter){}

  subscribeEvents(listener:Listener<RawChurchEvent>):()=>void{
    this.eventListeners.add(listener);
    if(!this.stopEvents)this.stopEvents=this.adapter.watchCollection('veranstaltungen',rows=>{
      this.events=Object.entries(rows??{}).flatMap(([eventKey,value])=>value&&typeof value==='object'?[{eventKey,...value as RawCommunityRecord}]:[]);
      this.eventListeners.forEach(next=>next(this.events));
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
      const state={connected,updatedAt:Date.now()};
      this.connectionListeners.forEach(next=>next(state));
    });
    return()=>this.connectionListeners.delete(listener);
  }

  dispose(){this.stopEvents?.();this.stopAnnouncements?.();this.stopConnection?.();this.stopEvents=this.stopAnnouncements=this.stopConnection=undefined;this.eventListeners.clear();this.announcementListeners.clear();this.connectionListeners.clear()}

  private upsertAnnouncement(messageId:string,value:unknown){
    if(value&&typeof value==='object')this.announcements.set(messageId,{messageId,...value as RawCommunityRecord});
    this.publishAnnouncements();
  }
  private publishAnnouncements(){const values=[...this.announcements.values()];this.announcementListeners.forEach(next=>next(values))}
}

export async function createCommunityRealtimeAdapter():Promise<CommunityRealtimeAdapter>{
  const [{getApp,getApps,initializeApp},{getDatabase,onChildAdded,onChildChanged,onChildRemoved,onValue,ref}]=await Promise.all([import('firebase/app'),import('firebase/database')]);
  const name='gottesdienstregie-community-main';
  const app=getApps().find(entry=>entry.name===name)??initializeApp({apiKey:'AIzaSyB0fmfjqC8aPyOEZxLjk1TfQal_s5xZFAM',authDomain:'philippusgemeindebie.firebaseapp.com',databaseURL:'https://philippusgemeindebie-default-rtdb.europe-west1.firebasedatabase.app',projectId:'philippusgemeindebie',storageBucket:'philippusgemeindebie.firebasestorage.app',messagingSenderId:'429968461937',appId:'1:429968461937:web:3c0f654404ec5d0e24cbd0'},name);
  const database=getDatabase(getApp(name)??app);
  return{
    watchCollection:(path,listener)=>onValue(ref(database,path),snapshot=>listener(snapshot.val()??{})),
    watchChildren:(path,handlers)=>{const target=ref(database,path),stops=[onChildAdded(target,snapshot=>handlers.added(snapshot.key!,snapshot.val())),onChildChanged(target,snapshot=>handlers.changed(snapshot.key!,snapshot.val())),onChildRemoved(target,snapshot=>handlers.removed(snapshot.key!))];return()=>stops.forEach(stop=>stop())},
    watchConnection:listener=>onValue(ref(database,'.info/connected'),snapshot=>listener(snapshot.val()===true)),
  };
}
