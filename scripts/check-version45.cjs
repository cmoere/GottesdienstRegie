const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map();function load(relative){const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),/\.(ts|tsx)$/.test(id)?id:`${id}.ts`)):original(id);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);return mod.exports}
const languages=load('src/languageCatalog.ts').translationLanguages;
const countries=load('src/flags/flagCountryCatalog.ts');
for(const language of languages)assert.match(countries.flagCountryForLanguage(language.code),/^[a-z]{2}$/i,`missing flag mapping for ${language.code}`);
assert.equal(new Set(languages.map(language=>countries.flagCountryForLanguage(language.code))).size>30,true,'the complete catalog should use representative country flags, not one shared fallback');
const modal=load('src/modalInteraction.ts');
assert.equal(modal.modalBlocksCanvas({querySelector:selector=>selector==='[aria-modal="true"]'?{}:null}),true);
assert.equal(modal.modalBlocksCanvas({querySelector:()=>null}),false);
const notes=fs.readFileSync('src/PersonalNotesPanel.tsx','utf8');
assert.match(notes,/createPortal/);assert.match(notes,/noteStatusPresentation/);assert.match(notes,/>undo</);assert.match(notes,/>redo</);
assert.equal(notes.includes('>Rückgängig</button>'),false);assert.equal(notes.includes('>Wiederholen</button>'),false);
const css=fs.readFileSync('src/version45.css','utf8');
assert.match(css,/body:has\(\.personal-notes-backdrop\).*\.format-toolbar/);
assert.match(css,/body:has\(\.personal-notes-backdrop\) #root\{pointer-events:none\}/);
assert.match(css,/\.event-link-row\{[^}]*grid-template-columns:minmax\(0,1fr\) 28px/);
console.log('Version 0.45 notes, modal, event help and flag checks passed.');
