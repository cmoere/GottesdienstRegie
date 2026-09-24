import {beforeEach,describe,expect,it} from 'vitest';
import {createLocalPresentationService} from './LocalPresentationService';
import {RevisionConflictError} from '../types';

describe('LocalPresentationService',()=>{
  beforeEach(()=>localStorage.clear());
  it('verhindert stilles Überschreiben einer neueren Revision',async()=>{
    const service=createLocalPresentationService(localStorage);
    const first=await service.create({title:'Test'});
    const a=structuredClone(first.document),b=structuredClone(first.document);
    a.title='Editor A'; b.title='Editor B';
    const saved=await service.save(a,first.revision);
    await expect(service.save(b,first.revision)).rejects.toBeInstanceOf(RevisionConflictError);
    await expect(service.load(b.presentationId)).resolves.toMatchObject({document:{title:'Editor A'},revision:saved.revision});
  });
});
