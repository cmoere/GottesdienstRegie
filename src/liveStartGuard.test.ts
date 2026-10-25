import {beforeEach,expect,it} from 'vitest';
import {createServiceItem,usePresentation} from './store';
import {captureLiveStartGuard} from './liveStartGuard';
beforeEach(()=>{usePresentation.getState().newDocument('Starttest');usePresentation.setState({items:[createServiceItem('content',{id:'first'})],eventLink:{eventKey:'event'},displayRoles:{'2':'main','1':'operator'},onAir:false})});
it('accepts identical reloaded content with fresh object references',()=>{
 const state=usePresentation.getState(),guard=captureLiveStartGuard(state);
 const current={...state,items:structuredClone(state.items),sections:structuredClone(state.sections)};
 expect(guard(current,true)).toBe(true);
});
it('accepts reordered assignment keys and unrelated save/selection state',()=>{
 const state=usePresentation.getState(),guard=captureLiveStartGuard(state);
 expect(guard({...state,displayRoles:{'1':'operator','2':'main'},selectedSlideId:'other',saveState:'saving'},true)).toBe(true);
});
it('rejects actual slide edits even when IDs remain the same',()=>{
 const state=usePresentation.getState(),guard=captureLiveStartGuard(state),items=structuredClone(state.items);
 items[0].slides[0].body='Changed';expect(guard({...state,items},true)).toBe(false);
});
it('rejects presentation, event, on-air, route and permission changes',()=>{
 const state=usePresentation.getState(),guard=captureLiveStartGuard(state);
 for(const patch of [{presentationId:'other'},{eventLink:{eventKey:'other'}},{onAir:true},{displayRoles:{'2':'stage'} as typeof state.displayRoles}])expect(guard({...state,...patch},true)).toBe(false);
 expect(guard(state,false)).toBe(false);
});
it('rejects date, service time, transition and section changes',()=>{
 const state=usePresentation.getState(),guard=captureLiveStartGuard(state);
 for(const patch of [{date:'2030-01-01'},{serviceTime:'23:00'},{transitionDefault:{...state.transitionDefault,durationMs:9000}},{sections:state.sections.map(section=>({...section,autoLoop:!section.autoLoop}))}])expect(guard({...state,...patch},true)).toBe(false);
});
