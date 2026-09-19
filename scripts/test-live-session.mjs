import assert from 'node:assert/strict';
const module = await import('../src/liveSession.ts').catch(error => {
 if(error.code === 'ERR_MODULE_NOT_FOUND') return {};
 throw error;
});
assert.equal(typeof module.startLiveSession, 'function', 'A guarded test-session start must exist');
const {startLiveSession} = module;
const input = {mode:'test',permitted:true,desktopAvailable:true,eventKey:'',assignments:{1:'operator',2:'main',3:'stage',4:'livestream',5:'lobby',6:'notes'}};
function harness(overrides={}) {
 const calls=[];
 const deps={
  preflight:async assignments=>{calls.push(['preflight',assignments]);return {ok:true,errors:[],warnings:[]}},
  displays:async()=>[{id:2,label:'Beamer'},{id:3,label:'Bühne'}],
  confirm:message=>{calls.push(['confirm',message]);return true},
  isCurrent:()=>true,
  start:async assignments=>{calls.push(['start',assignments]);return true},
  ...overrides,
 };
 return {calls,deps};
}
for(const patch of [{permitted:false},{desktopAvailable:false},{mode:'live'}]) {
 const h=harness(), result=await startLiveSession({...input,...patch},h.deps);
 assert.equal(result.started,false);
 assert.ok(result.error);
 assert.deepEqual(h.calls,[],'Unauthorized / unlinked normal starts cannot touch outputs');
}
{
 const h=harness(),result=await startLiveSession(input,h.deps);
 assert.equal(result.started,true);
 assert.equal(result.allowRewards,false,'Testing is not a real service accomplishment');
 assert.deepEqual(h.calls.filter(c=>c[0]==='start')[0][1],{2:'main',3:'stage'});
 assert.deepEqual(h.calls[0],['preflight',{2:'main',3:'stage'}]);
 const message=h.calls.find(c=>c[0]==='confirm')[1];
 assert.match(message,/MAIN.*Beamer/);
 assert.match(message,/STAGE.*Bühne/);
 assert.ok(h.calls.findIndex(c=>c[0]==='confirm')<h.calls.findIndex(c=>c[0]==='start'));
 assert.deepEqual(input.assignments,{1:'operator',2:'main',3:'stage',4:'livestream',5:'lobby',6:'notes'},'Keep saved assignments unchanged');
}
for(const overrides of [
 {preflight:async()=>({ok:false,errors:['MAIN fehlt'],warnings:[]})},
 {confirm:()=>false},
 {isCurrent:()=>false},
 {displays:async()=>[]},
]) {
 const h=harness(overrides),result=await startLiveSession(input,h.deps);
 assert.equal(result.started,false);
 assert.ok(!h.calls.some(c=>c[0]==='start'),'Failed, stale or canceled start must not activate outputs');
}
{
 const h=harness(),result=await startLiveSession({...input,mode:'live',eventKey:'service-123'},h.deps);
 assert.equal(result.started,true);assert.equal(result.allowRewards,true);
 assert.deepEqual(h.calls.find(c=>c[0]==='start')[1],input.assignments);
}
{
 const h=harness(),result=await startLiveSession({...input,preflightOnly:true},h.deps);
 assert.equal(result.started,false);assert.equal(result.preflight.ok,true);
 assert.ok(!h.calls.some(c=>c[0]==='start'||c[0]==='confirm'));
}
{
 const h=harness({start:async()=>false}),result=await startLiveSession(input,h.deps);
 assert.equal(result.started,false);assert.ok(result.error);
}
console.log('PASS: permissions, event requirement, real preflight, output whitelist, explicit confirmation, cancellation, stale context, reward eligibility and start failure');
