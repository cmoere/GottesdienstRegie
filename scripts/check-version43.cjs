const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map();function load(relative){const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),id.endsWith('.ts')?id:`${id}.ts`)):original(id);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);return mod.exports}
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
console.log('Version 0.43 checks passed.');
