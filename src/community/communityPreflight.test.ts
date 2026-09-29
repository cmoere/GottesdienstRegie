import {describe,expect,it} from 'vitest';
import {communityPreflight} from './communityPreflight';

const event={id:'event',title:'Gottesdienst'};
const announcement={id:'message',title:'Hinweis'};

describe('communityPreflight',()=>{
  it('reports counts and resolves a linked event without blocking',()=>{
    const result=communityPreflight({mode:'online',events:[event],announcements:[announcement]},'event',[{id:'messages',type:'announcement',target:'preLoop'}]);
    expect(result).toMatchObject({ready:true,eventCount:1,announcementCount:1,linkedEventResolved:true});
    expect(result.warnings).toEqual([]);
  });
  it('warns for offline data, missing links and optional empty loops',()=>{
    const result=communityPreflight({mode:'offline-cache',updatedAt:new Date('2026-10-04T09:00:00').getTime(),events:[],announcements:[]},'missing',[{id:'messages',type:'announcement',target:'postLoop'}]);
    expect(result.ready).toBe(true);
    expect(result.linkedEventResolved).toBe(false);
    expect(result.warnings.join(' ')).toContain('Offline');
    expect(result.warnings.join(' ')).toContain('nicht gefunden');
    expect(result.warnings.join(' ')).toContain('keine gültigen Inhalte');
  });
});
