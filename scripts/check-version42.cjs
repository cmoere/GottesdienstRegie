const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map(); function load(relative){const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id.endsWith('.ts')?id:`${id}.ts`)):original(id);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports}
const sections={pre:{id:'pre',title:'VORPROGRAMM',type:'preLoop',supportsLoopItems:true},service:{id:'service',title:'GOTTESDIENST',type:'service'}};
const placement=load('src/itemPlacementPolicy.ts');
assert.deepEqual(placement.menuItemTypesForSection(sections.pre).sort(),placement.loopOnlyItemTypes.slice().sort());
assert.equal(placement.menuItemTypesForSection(sections.pre).includes('song'),false);
assert.equal(placement.menuItemTypesForSection(sections.service).includes('weather'),false);
assert.equal(placement.menuItemTypesForSection(sections.service).includes('song'),true);
const {placePopover}=load('src/popoverGeometry.ts');
assert.deepEqual(placePopover({left:450,right:500,top:350,bottom:380},{width:420,height:300},{width:600,height:500},6),{left:174,top:44,side:'top'});
assert.equal(placePopover({left:10,right:40,top:10,bottom:30},{width:300,height:220},{width:320,height:240},6).left>=6,true);
const notes=load('src/noteStatus.ts'); assert.equal(notes.noteStatusMessage('idle'),'Diese Notiz ist nur für dich sichtbar.');assert.equal(notes.PERSONAL_NOTE_SAVED_MS,5000);
const access=load('src/operatorAccessibility.ts');assert.deepEqual([0,1,2,3,4].map(access.operatorScaleFactor),[.85,.925,1,1.1,1.2]);assert.equal(access.normalizeOperatorScale(9),4);assert.equal(access.normalizeOperatorScale(-2),0);
const appearance=load('electron/platformAppearance.ts');assert.equal(appearance.platformAppearance('darwin','25.0.0').liquidGlass,true);assert.equal(appearance.platformAppearance('darwin','24.6.0').liquidGlass,false);assert.equal(appearance.platformAppearance('win32','10.0.0').liquidGlass,false);
const media=load('src/mediaSelection.ts');const item=media.createVideoItemFromAsset({id:'v',name:'Film',kind:'video',url:'https://example.test/a.mp4'},'service');assert.equal(item.type,'video');assert.equal(item.slides[0].elements[0].type,'video');assert.throws(()=>media.createVideoItemFromAsset({id:'i',name:'Bild',kind:'image',url:'https://example.test/a.jpg'},'service'),/VIDEO_ASSET_REQUIRED/);
const shapes=load('src/shapeCatalog.ts');for(const shape of shapes.shapeCatalog)assert.ok(shape.path||shape.paths,`${shape.kind} lacks artwork`);assert.notEqual(shapes.shapeByKind('church').path,shapes.shapeByKind('rectangle').path);assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(shapes.shapeCatalog.map(x=>x.symbol??'').join('')),false);
console.log('Version 0.42 checks passed.');
