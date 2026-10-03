import {describe,expect,it} from 'vitest';
import {RoomService} from './RoomService';

const rooms=[{roomId:'gemeindesaal',raumname:'Gemeindesaal',kurzname:'Saal',etage:'EG',gebaeude:'Gemeindezentrum',kapazitaet:250,barrierefrei:true}];

describe('RoomService',()=>{
  it.each(['gemeindesaal','Gemeindesaal','Saal','Gemeindesaal EG'])('resolves %s to the stable room record',alias=>{
    expect(new RoomService(rooms).resolve(alias)).toMatchObject({roomId:'gemeindesaal',name:'Gemeindesaal',floor:'EG',building:'Gemeindezentrum',capacity:250,accessible:true});
  });
  it('never exposes an unresolved raw room id',()=>expect(new RoomService([]).display('interne_id')).toBe('Raum'));

  it('flattens nested firebase room containers and preserves the canonical child key',()=>{
    const service=new RoomService({rooms:{buildingA:{room_list:{'-dieJsO8X':{raumname:'Eltern-Kind-Raum',kurzname:'EKR',etage:'EG',gebaeude:'Gemeindezentrum',kapazitaet:20,barrierefrei:true}}}}});
    expect(service.resolve('-dieJsO8X')).toMatchObject({roomId:'-dieJsO8X',name:'Eltern-Kind-Raum',shortName:'EKR',floor:'EG',building:'Gemeindezentrum',capacity:20,accessible:true});
  });

  it('does not mistake a child-watcher container id for a room id',()=>{
    const service=new RoomService([{roomId:'buildingA',rooms:{'-dieJsO8X':{raumname:'Eltern-Kind-Raum',etage:'EG'}}}]);
    expect(service.resolve('buildingA')).toBeNull();
    expect(service.resolve('-dieJsO8X')).toMatchObject({roomId:'-dieJsO8X',name:'Eltern-Kind-Raum',floor:'EG'});
  });

  it.each(['familien raum','FR','familienraum-eg','EG Familienraum','Familienraum Haus West','räume/familien'])('resolves extended alias %s',reference=>{
    const service=new RoomService({räume:{familien:{id:'family-room',displayName:'Familienraum',shortName:'FR',floor:'EG',building:'Haus West',slug:'familien-raum',aliases:['familienraum-eg'],searchTerms:['familien raum']}}});
    expect(service.resolve(reference)?.roomId).toBe('family-room');
  });

  it('normalizes umlauts and metadata aliases',()=>{
    const service=new RoomService({roomList:{'-r':{meta:{name:'Säälchen',shortName:'SÄ'},stockwerk:'OG 1',haus:'Anbau',code:'SAE'}}});
    expect(service.resolve('saalchen og 1')?.name).toBe('Säälchen');
    expect(service.resolve('SAE')?.building).toBe('Anbau');
  });
});
