import {describe,expect,it} from 'vitest';
import {communityPreflight} from './communityPreflight';

const event={id:'event',title:'Gottesdienst'};
const announcement={id:'message',title:'Hinweis'};

describe('communityPreflight',()=>{
  it('reports counts and resolves a linked event without blocking',()=>{
    const result=communityPreflight({mode:'online',events:[{...event,veranstaltungsort:'raum',raum:'saal'}],rooms:[{roomId:'saal',raumname:'Gemeindesaal'}],announcements:[announcement],loaded:{events:true,rooms:true,announcements:true},postProgramPrepared:true},'event',[{id:'messages',type:'announcement',target:'preLoop'}]);
    expect(result).toMatchObject({ready:true,eventCount:1,roomCount:1,announcementCount:1,linkedEventResolved:true,currentRoomResolved:true,postProgramPrepared:true});
    expect(result.warnings).toEqual([]);
  });
  it('warns for offline data, missing links and optional empty loops',()=>{
    const result=communityPreflight({mode:'offline-cache',updatedAt:new Date('2026-10-04T09:00:00').getTime(),events:[],rooms:[],announcements:[],loaded:{events:true,rooms:false,announcements:true},postProgramPrepared:false},'missing',[{id:'messages',type:'announcement',target:'postLoop'}]);
    expect(result.ready).toBe(true);
    expect(result.linkedEventResolved).toBe(false);
    expect(result.warnings.join(' ')).toContain('Offline');
    expect(result.warnings.join(' ')).toContain('nicht gefunden');
    expect(result.warnings.join(' ')).toContain('keine gültigen Inhalte');
    expect(result.warnings.join(' ')).toContain('Räume wurden noch nicht geladen');
  });

  it('reports unresolved planned and replacement room ids to the operator only',()=>{
    const result=communityPreflight({mode:'online',events:[{...event,veranstaltungsort:'raum',raum:'-dieJsO8X',ersatzortType:'raum',ersatzort:'-new'}],rooms:[],announcements:[],loaded:{events:true,rooms:true,announcements:true},postProgramPrepared:false},'event',[]);
    expect(result.ready).toBe(true);
    expect(result.currentRoomResolved).toBe(false);
    expect(result.warnings).toContain('Raum -dieJsO8X konnte unter /rooms nicht aufgelöst werden.');
    expect(result.warnings).toContain('Ersatzraum -new konnte unter /rooms nicht aufgelöst werden.');
    expect(result.warnings).toContain('Die Nachprogramm-Raumanzeige ist noch nicht vorbereitet.');
  });
});
