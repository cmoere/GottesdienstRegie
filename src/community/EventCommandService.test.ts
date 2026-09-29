import {describe,expect,it,vi} from 'vitest';
import {EventCommandService} from './EventCommandService';

describe('EventCommandService',()=>{
  it('writes effective fields without overwriting planned fields',async()=>{
    const write=vi.fn(),service=new EventCommandService(write);
    await service.updateEffectiveServiceTime('-Oabc',{start:new Date('2026-10-04T11:00:00'),end:new Date('2026-10-04T12:30:00')});
    expect(write).toHaveBeenCalledWith('-Oabc',{Verspaetungsanfangsdatum:'2026-10-04',Verspaetungsanfangsuhrzeit:'11:00',Verspaetungsenddatum:'2026-10-04',Verspaetungsenduhrzeit:'12:30'});
    expect(JSON.stringify(write.mock.calls)).not.toContain('start_uhrzeit');
  });
});
