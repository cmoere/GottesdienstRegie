const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map();function load(relative){const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),/\.(ts|tsx)$/.test(id)?id:`${id}.ts`)):original(id);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);return mod.exports}
const terms=load('src/termsContent.ts');
assert.ok(terms.TERMS_VERSION);assert.ok(terms.TERMS_EFFECTIVE_DATE);assert.ok(terms.termsSections.length>=15);
for(const topic of['Haftung','Medien','Cloud','Übersetzung','Kündigung'])assert.ok(terms.plainTerms().includes(topic),topic);
const normalize=value=>value.replace(/\r/g,'').replace(/\s+/g,' ').trim();
assert.equal(normalize(fs.readFileSync('build/terms.txt','utf8')),normalize(terms.plainTerms()));
const html=fs.readFileSync('public/terms/index.html','utf8');assert.ok(html.includes(terms.TERMS_VERSION));assert.equal(html.includes('release-notes'),false);
const loop=load('src/loopItemFactory.ts');
for(const type of ['announcement','birthday','event','weather','loopQuiz','loopCountdown','clock','bibleVerse','loopQr','infoCard','today','nextEvents']){
  const draft=loop.createLoopItem(type,'pre',1000);
  assert.equal(draft.type,type);assert.equal(draft.sectionId,'pre');assert.ok(draft.title);
}
loop.resetInsertionGuards();
assert.equal(loop.consumeInsertionGuard('pre:weather',1000),true);
assert.equal(loop.consumeInsertionGuard('pre:weather',1200),false);
assert.equal(loop.consumeInsertionGuard('pre:weather',1500),true);
const eventStatus=load('src/EventLinkStatus.tsx');
const now=new Date('2026-09-20T10:00:00+02:00');
assert.equal(eventStatus.eventLinkViewModel(undefined,[],now).state,'unlinked');
const snapshot={eventKey:'evt-1',titleSnapshot:'Gottesdienst',dateSnapshot:'2026-09-21',timeSnapshot:'10:30'};
let eventVm=eventStatus.eventLinkViewModel(snapshot,[{eventKey:'evt-1',titel:'Geändert',start_datum:'2026-09-21',start_uhrzeit:'11:00',cancelled:true}],now);
assert.equal(eventVm.state,'cancelled');assert.equal(eventVm.plannedTime,'10:30');assert.ok(eventVm.warning);
eventVm=eventStatus.eventLinkViewModel(snapshot,[],now);assert.equal(eventVm.state,'missing');assert.equal(eventVm.plannedDate,'2026-09-21');
const packCatalog=load('electron/translationPackCatalog.ts');assert.equal(packCatalog.packForPair('en','de').key,'en-de');assert.equal(packCatalog.packForPair('ja','de'),undefined);const mainSource=fs.readFileSync('electron/main.ts','utf8');assert.ok(mainSource.includes('getReader()'));assert.equal(mainSource.includes('response.arrayBuffer()'),false);const managerSource=fs.readFileSync('src/translationPackManager.ts','utf8');assert.equal(/download\(['"](?:en-de|de-en)/.test(managerSource),false);
;(async()=>{const os=require('node:os'),fsp=require('node:fs/promises');const base=await fsp.mkdtemp(path.join(os.tmpdir(),'gr-storage-')),categories=['translation-packs','transformers-cache','media-cache','thumbnails','temporary-downloads','web-cache'],roots=Object.fromEntries(categories.map(name=>[name,path.join(base,name)]));await fsp.mkdir(path.join(roots['media-cache'],'nested'),{recursive:true});await fsp.writeFile(path.join(roots['media-cache'],'nested','a.bin'),Buffer.alloc(12));const storage=load('electron/StorageMaintenanceService.ts'),service=new storage.StorageMaintenanceService(roots);let storageState=await service.snapshot();assert.equal(storageState.categories.find(value=>value.category==='media-cache').bytes,12);await service.clear(['media-cache']);storageState=await service.snapshot();assert.equal(storageState.categories.find(value=>value.category==='media-cache').bytes,0);if(process.platform==='win32'){try{await fsp.symlink(base,path.join(roots.thumbnails,'escape'),'junction');storageState=await service.snapshot();assert.ok(storageState.categories.find(value=>value.category==='thumbnails').error)}catch{}}await fsp.rm(base,{recursive:true,force:true});console.log('Version 0.43 checks passed.');})().catch(error=>{console.error(error);process.exitCode=1});
