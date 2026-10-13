import {it,expect} from 'vitest';
import {createServiceItem} from './store';
import {ensurePostProgramSystemSlide} from './postProgramSystemSlide';
import {postProgramCandidates,unavailablePostProgramTarget} from './postProgramNavigation';
it('includes ordinary authored post slides after the system page',()=>{
 const content=createServiceItem('content',{id:'thanks',sectionId:'post'});
 const items=ensurePostProgramSystemSlide([content]);
 expect(postProgramCandidates(items,true).map(i=>i.id)).toEqual(['system-post-program-room-notice','thanks']);
 expect(postProgramCandidates(items,false).map(i=>i.id)).toEqual(['thanks']);
 expect(unavailablePostProgramTarget(items)?.itemId).toBe('thanks');
});
it('returns the final service slide rather than an empty system page when no room notice is available',()=>{
 const service=createServiceItem('content',{id:'last',sectionId:'service'});
 expect(unavailablePostProgramTarget(ensurePostProgramSystemSlide([service]))?.itemId).toBe('last');
 expect(unavailablePostProgramTarget(ensurePostProgramSystemSlide([]))).toBeUndefined();
});
it('does not select an empty announcement as a room-notice fallback',()=>{
 const message=createServiceItem('announcement',{id:'empty-message',sectionId:'post',itemCategory:'loop'});
 expect(unavailablePostProgramTarget(ensurePostProgramSystemSlide([message]),()=>false)).toBeUndefined();
});
