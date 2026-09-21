const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const cache=new Map();function load(relative){const file=path.resolve(relative);if(cache.has(file))return cache.get(file).exports;const mod=new Module(file,module);mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);const original=mod.require.bind(mod);mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),/\.(ts|tsx)$/.test(id)?id:`${id}.ts`)):original(id);mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,file);return mod.exports}
const preferences=load('src/preferences.ts');
assert.equal(preferences.usePreferences.getState().operatorScale,3,'new installations should start with the slightly larger operator UI');
assert.equal(preferences.migratePreferencesForV44({operatorScale:2}).operatorScale,3,'existing installations should receive the v44 default once');
assert.equal(preferences.migratePreferencesForV44({operatorScale:4}).operatorScale,3,'the one-time v44 migration should establish the same baseline for every upgraded installation');
const access=load('src/operatorAccessibility.ts');
assert.equal(access.effectiveOperatorScale(3,false),1.1,'the operator UI should use the selected larger scale');
assert.equal(access.effectiveOperatorScale(3,true),1,'output windows must never inherit the operator UI scale');
const css=fs.readFileSync('src/version42.css','utf8');
assert.match(css,/\.app:not\(\.output-app\)\{font-size:calc\(1rem \* var\(--operator-scale,1\)\)\}/,'operator scaling should change typography without resizing fixed-size form controls');
console.log('Version 0.44 operator sizing checks passed.');
