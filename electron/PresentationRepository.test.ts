import {afterEach,describe,expect,it,vi} from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PresentationRepository} from './PresentationRepository';

const directories:string[]=[];
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(directories.splice(0).map(dir=>fs.rm(dir,{recursive:true,force:true})))});
async function setup(){const root=await fs.mkdtemp(path.join(os.tmpdir(),'gr-recovery-'));directories.push(root);return{root,repo:new PresentationRepository(root)}}
const document=(title:string)=>({presentationId:'service',title,date:'2026-10-14',createdAt:'2026-10-14T08:00:00Z',updatedAt:'2026-10-14T08:00:00Z',sections:[],items:[]});

describe('presentation crash recovery',()=>{
  it('retries a transient Windows state-file lock without losing the prior valid state',async()=>{
    const {root,repo}=await setup();await repo.setState({lastPresentationId:'before'});
    const rename=fs.rename.bind(fs),target=path.join(root,'presentation-state.json');let attempts=0;
    vi.spyOn(fs,'rename').mockImplementation(async(source,destination)=>{
      if(destination===target&&attempts++===0){
        expect(JSON.parse(await fs.readFile(target,'utf8')).lastPresentationId).toBe('before');
        throw Object.assign(new Error('transient Windows lock'),{code:'EPERM'});
      }
      return rename(source,destination);
    });
    await expect(repo.setState({lastPresentationId:'after'})).resolves.toBe(true);
    expect(attempts).toBe(2);
    expect((await repo.getState()).lastPresentationId).toBe('after');
    expect((await fs.readdir(root)).some(name=>name.endsWith('.tmp'))).toBe(false);
  });
  it('keeps the prior state and reports a permanent lock after bounded retries',async()=>{
    const {root,repo}=await setup();await repo.setState({lastPresentationId:'before'});
    const target=path.join(root,'presentation-state.json'),rename=fs.rename.bind(fs);let attempts=0;
    vi.spyOn(fs,'rename').mockImplementation(async(source,destination)=>{
      if(destination===target){attempts++;throw Object.assign(new Error('persistent Windows lock'),{code:'EBUSY'})}
      return rename(source,destination);
    });
    await expect(repo.setState({lastPresentationId:'after'})).rejects.toMatchObject({code:'EBUSY'});
    expect(attempts).toBe(6);
    expect((await repo.getState()).lastPresentationId).toBe('before');
    expect((await fs.readdir(root)).some(name=>name.endsWith('.tmp'))).toBe(false);
  });
  it('does not offer an older checkpoint over a newer explicit save',async()=>{
    const {root,repo}=await setup();await repo.beginSession();
    await repo.save(document('Original'));
    const checkpoint=repo.saveRecovery(document('Unsaved A'));
    const saved=repo.save(document('Saved B'));
    await Promise.all([checkpoint,saved]);
    expect((await new PresentationRepository(root).read('service')).title).toBe('Saved B');
    expect(await new PresentationRepository(root).beginSession()).toBeNull();
  });

  it('retains a newer checkpoint queued while an older explicit save is pending',async()=>{
    const {root,repo}=await setup();await repo.beginSession();
    const saved=repo.save(document('Saved A'));
    const checkpoint=repo.saveRecovery(document('Unsaved B'));
    await Promise.all([saved,checkpoint]);
    expect((await new PresentationRepository(root).read('service')).title).toBe('Saved A');
    expect((await new PresentationRepository(root).beginSession())?.document.title).toBe('Unsaved B');
  });

  it('does not fall back across an explicit save into an obsolete checkpoint',async()=>{
    const {root,repo}=await setup();await repo.beginSession();
    await repo.saveRecovery(document('Unsaved A'));
    await repo.save(document('Saved B'));
    await repo.saveRecovery(document('Unsaved C'));
    expect((await new PresentationRepository(root).recoveryInfo())?.document.title).toBe('Unsaved C');
    await fs.writeFile(path.join(root,'recovery','service.json'),'{broken');
    expect(await new PresentationRepository(root).beginSession()).toBeNull();
    expect((await repo.read('service')).title).toBe('Saved B');
  });

  it('recovers unsaved edits after restart without replacing the saved presentation',async()=>{
    const {root,repo}=await setup();
    await repo.save(document('Saved'));
    expect(await repo.beginSession()).toBeNull();
    await repo.saveRecovery({...document('Unsaved'),onAir:true,liveSlideId:'live',audio:{playing:true}});
    expect((await repo.read('service')).title).toBe('Saved');
    const recovery=await new PresentationRepository(root).beginSession();
    expect(recovery?.document.title).toBe('Unsaved');
    expect(recovery?.document).not.toHaveProperty('onAir');
    expect(recovery?.document).not.toHaveProperty('liveSlideId');
    expect(recovery?.document).not.toHaveProperty('audio');
  });

  it.each(['{broken',JSON.stringify({presentationId:'service',title:'Broken',items:'wrong',sections:[]}),JSON.stringify({presentationId:'service',title:'Broken',sections:[],items:[{id:'item',slides:[{id:'slide',elements:[null]}]}]})])('falls back when newest recovery is corrupt: %s',async corrupt=>{
    const {root,repo}=await setup();await repo.beginSession();
    await repo.saveRecovery(document('Previous'));
    await repo.saveRecovery(document('Newest'));
    await fs.writeFile(path.join(root,'recovery','service.json'),corrupt);
    expect((await new PresentationRepository(root).beginSession())?.document.title).toBe('Previous');
  });

  it('waits for pending snapshots before marking a clean exit and does not offer recovery',async()=>{
    const {root,repo}=await setup();await repo.beginSession();
    const writes=Array.from({length:8},(_,index)=>repo.saveRecovery(document(`Edit ${index}`)));
    await repo.markClean();await Promise.all(writes);
    expect(await new PresentationRepository(root).beginSession()).toBeNull();
    expect(JSON.parse(await fs.readFile(path.join(root,'recovery','service.json'),'utf8')).title).toBe('Edit 7');
    expect((await fs.readdir(path.join(root,'recovery'))).sort()).toEqual(['service.json','service.previous.json']);
  });

  it('preserves the prior offer across repeated startup calls',async()=>{
    const {root,repo}=await setup();await repo.beginSession();await repo.saveRecovery(document('Edits'));
    const restarted=new PresentationRepository(root);
    expect((await restarted.beginSession())?.document.title).toBe('Edits');
    expect((await restarted.beginSession())?.document.title).toBe('Edits');
  });

  it('does not manufacture a crash offer when library metadata is saved after clean exit',async()=>{
    const {root,repo}=await setup();await repo.save(document('Saved'));await repo.markClean();await repo.rename('service','Renamed');
    expect(await new PresentationRepository(root).beginSession()).toBeNull();
  });
});
