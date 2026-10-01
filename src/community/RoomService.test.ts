import {describe,expect,it} from 'vitest';
import {RoomService} from './RoomService';

const rooms=[{roomId:'gemeindesaal',raumname:'Gemeindesaal',kurzname:'Saal',etage:'EG',gebaeude:'Gemeindezentrum',kapazitaet:250,barrierefrei:true}];

describe('RoomService',()=>{
  it.each(['gemeindesaal','Gemeindesaal','Saal','Gemeindesaal EG'])('resolves %s to the stable room record',alias=>{
    expect(new RoomService(rooms).resolve(alias)).toMatchObject({roomId:'gemeindesaal',name:'Gemeindesaal',floor:'EG',building:'Gemeindezentrum',capacity:250,accessible:true});
  });
  it('never exposes an unresolved raw room id',()=>expect(new RoomService([]).display('interne_id')).toBe('Raum'));
});
