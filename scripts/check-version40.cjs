const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map();
function load(relative){
 const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;
 const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);
 const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id.endsWith('.ts')?id:id+'.ts')):original(id);
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports;
}

const {getLoopCoreLayer,getUserOverlayElements,normalizeLoopOverlays}=load('src/loopCoreLayer.ts');
const text=(id,properties={})=>({id,type:'text',name:id,x:0,y:0,width:100,height:100,rotation:0,opacity:1,locked:false,visible:true,zIndex:1,properties});
const image=id=>({...text(id),type:'image'});
const slide={id:'s',itemId:'weather',order:0,enabled:true,title:'Wetter',body:'',background:'#000',transition:'fade',transitionDuration:500,notes:'',elements:[text('legacy',{systemLayer:true}),text('user-text'),image('user-image')]};
const weatherItem={id:'weather',type:'weather',title:'Wetter',metadata:{},slides:[slide]};
assert.equal(getLoopCoreLayer(slide,weatherItem).kind,'weather');
assert.deepEqual(getUserOverlayElements(slide,weatherItem).map(x=>x.id),['user-text','user-image']);
assert.deepEqual(normalizeLoopOverlays({...slide,elements:undefined},weatherItem).elements,[]);
assert.equal(getLoopCoreLayer(slide,{...weatherItem,type:'content'}),null);
assert.equal(Object.isFrozen(getLoopCoreLayer(slide,weatherItem)),true);
const {buildRenderedSlideSnapshot,cloneRenderedSlideSnapshot}=load('src/renderedSlideSnapshot.ts');
const snapshotSource={...slide,elements:[text('visible',{text:'A'})]};
const preview=buildRenderedSlideSnapshot(snapshotSource,{...weatherItem,slides:[snapshotSource]},'main',123);
snapshotSource.elements[0].properties.text='B';
const live=cloneRenderedSlideSnapshot(preview);
assert.equal(live.slide.elements[0].properties.text,'A');
assert.equal(live.createdAt,123);
assert.equal(Object.isFrozen(live.slide.elements[0].properties),true);
assert.notEqual(buildRenderedSlideSnapshot(snapshotSource,{...weatherItem,slides:[snapshotSource]},'main',124).hash,live.hash);
console.log('PASS: version 0.40 domain contracts');
