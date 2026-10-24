import type {SpokenAnnouncement} from './types';
export const generalAnnouncementProbe:SpokenAnnouncement={id:'general',title:'Allgemeine Testdurchsage',text:'Dies ist eine Testdurchsage der GottesdienstRegie. Herzlich willkommen zum Gottesdienst.',revision:'general-probe-1',priority:'normal'};
export type AnnouncementTestSelection={kind:'general'}|{kind:'message';id:string};
type Controller={start(selection:AnnouncementTestSelection,musicPercent:number):Promise<void>;stop():void};
let owner:Controller|null=null;
/** The existing control-shell owner remains the only player, including manual probes. */
export function registerAnnouncementTestController(controller:Controller){owner=controller;return()=>{if(owner===controller)owner=null}}
export function startAnnouncementTest(selection:AnnouncementTestSelection,musicPercent:number){
 if(!owner)return Promise.reject(Error('Die Ansagensteuerung ist nicht verfügbar.'));
 return owner.start(selection,musicPercent);
}
export function stopAnnouncementTest(){owner?.stop()}
