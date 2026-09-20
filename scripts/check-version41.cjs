const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const cache = new Map();
function load(relative) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file, module);
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  cache.set(file, mod);
  const original = mod.require.bind(mod);
  mod.require = (id) => id.startsWith('.')
    ? load(path.resolve(path.dirname(file), id.endsWith('.ts') ? id : `${id}.ts`))
    : original(id);
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, file);
  return mod.exports;
}
const {
  allowedItemTypes,
  canInsertItemType,
  placementViolation,
} = load('src/itemPlacementPolicy.ts');

const sections = {
  pre: { id: 'pre', title: 'VORPROGRAMM', type: 'preLoop', supportsLoopItems: true },
  post: { id: 'post', title: 'NACHPROGRAMM', type: 'postLoop', supportsLoopItems: true },
  service: { id: 'service', title: 'GOTTESDIENST', type: 'service' },
};

assert.equal(canInsertItemType('weather', sections.pre), true);
assert.equal(canInsertItemType('weather', sections.post), true);
assert.equal(canInsertItemType('weather', sections.service), false);
assert.equal(canInsertItemType('announcement', sections.service), false);
assert.equal(canInsertItemType('content', sections.service), true);
assert.equal(canInsertItemType('content', sections.pre), true);
assert.equal(allowedItemTypes(sections.service).includes('weather'), false);
assert.equal(allowedItemTypes(sections.pre).includes('weather'), true);
assert.equal(
  placementViolation({ id: 'legacy', type: 'weather' }, sections.service)?.code,
  'LOOP_SECTION_REQUIRED',
);
assert.equal(placementViolation({ id: 'regular', type: 'content' }, sections.service), null);
console.log('Version 0.41 placement policy checks passed.');
