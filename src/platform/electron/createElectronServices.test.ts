import {describe,expect,it,vi} from 'vitest';
import {blankPresentationDocument} from '../../store';
import {createElectronServices} from './createElectronServices';

describe('createElectronServices',()=>{
  it('delegiert Präsentationsspeicherung an Electron',async()=>{
    const document=blankPresentationDocument('Test');
    const summary={id:'p1',title:'Test',date:document.date,createdAt:document.createdAt,updatedAt:document.updatedAt,archived:false,trashed:false,itemCount:0,slideCount:0};
    const save=vi.fn().mockResolvedValue(summary);
    const bridge={presentation:{save}} as unknown as NonNullable<Window['desktop']>;
    const services=createElectronServices(bridge);
    await expect(services.presentations.save(document)).resolves.toEqual({summary,revision:summary.updatedAt});
    expect(save).toHaveBeenCalledWith(document);
  });
});
