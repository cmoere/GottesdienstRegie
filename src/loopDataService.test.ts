import {describe,expect,it} from 'vitest';
import {toLoopPublicEvent} from './loopDataService';

describe('toLoopPublicEvent',()=>{
  it('uses the normalized effective time and location',()=>{
    expect(toLoopPublicEvent({id:'event',title:'Forum',effectiveStart:'2026-10-04T10:45:00.000Z',effectiveLocation:'Gemeindesaal · EG',cancelled:false})).toEqual({id:'event',title:'Forum',startsAt:'2026-10-04T10:45:00.000Z',location:'Gemeindesaal · EG',cancelled:false});
  });
});
