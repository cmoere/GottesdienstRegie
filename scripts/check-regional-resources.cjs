const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

// Tooling only: compile our data-only shared TypeScript, not untrusted text packs.
function loadShared(filename) {
  const absolute=path.resolve(__dirname,'../shared/regional',filename);
  const compiled=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  });
  const exports={};
  vm.runInNewContext(compiled.outputText,{exports},{filename:absolute,timeout:1000});
  return exports;
}
const {validateRegionalPack}=loadShared('validation.ts');
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

function flatten(value,prefix,result={}) {
  if (!record(value)) return result;
  for (const [key,entry] of Object.entries(value)) {
    const id=`${prefix}.${key}`;
    if (typeof entry==='string') result[id]=entry;
    else if (record(entry)) flatten(entry,id,result);
  }
  return result;
}

function checkRegionalCoverage({regions,inventory,packs,docs}) {
  const issues=[];
  if (!record(inventory)||inventory.complete!==true) issues.push('inventory: incomplete');
  const base={ui:{},native:{}};
  const documentation={};
  const seen=new Set();
  for (const entry of inventory?.entries??[]) {
    if (seen.has(entry.key)) issues.push(`inventory: duplicate key ${entry.key}`);
    seen.add(entry.key);
    if (entry.status==='review-required') { issues.push(`inventory: ${entry.key} requires classification`); continue; }
    if (entry.status==='excluded') continue;
    if (entry.status!=='app-owned') { issues.push(`inventory: ${entry.key} has invalid classification`); continue; }
    if (typeof entry.text!=='string'||!entry.text.trim()) { issues.push(`inventory: ${entry.key} has empty source text`); continue; }
    if (entry.key.startsWith('ui.')) base.ui[entry.key.slice(3)]=entry.text;
    else if (entry.key.startsWith('native.')) base.native[entry.key.slice(7)]=entry.text;
    else if (/^(help|helpUI|release)\./.test(entry.key)) documentation[entry.key]=entry.text;
    else issues.push(`inventory: ${entry.key} has no resource namespace`);
  }
  if (!Object.keys(base.ui).length) issues.push('inventory: missing ui corpus');
  if (!Object.keys(base.native).length) issues.push('inventory: missing native corpus');
  for (const category of ['help','helpUI','release']) {
    if (!Object.keys(documentation).some(key=>key.startsWith(`${category}.`))) issues.push(`inventory: missing ${category} corpus`);
  }
  for (const region of regions) {
    const pack=own(packs,region.id)?packs[region.id]:null;
    if (!pack) issues.push(`${region.id}: missing interface pack`);
    else for (const issue of validateRegionalPack(pack,region.id,base)) issues.push(`${region.id}: ${issue.path} ${issue.code}`);
    const doc=own(docs,region.id)?docs[region.id]:null;
    if (!record(doc)) { issues.push(`${region.id}: missing documentation pack`); continue; }
    const translated={...flatten(doc.help,'help'),...flatten(doc.helpUI,'helpUI'),...flatten(doc.releases,'release')};
    for (const [key,source] of Object.entries(documentation)) {
      if (!own(translated,key)||!translated[key].trim()) { issues.push(`${region.id}: ${key} missing-text`); continue; }
      const problem=validateRegionalPack({id:region.id,ui:{text:translated[key]},native:{}},region.id,{ui:{text:source},native:{}});
      if (problem.some(issue=>issue.code==='placeholder-mismatch')) issues.push(`${region.id}: ${key} placeholder-mismatch`);
    }
    for (const key of Object.keys(translated)) {
      if (!own(documentation,key)) issues.push(`${region.id}: ${key} unexpected-text`);
    }
  }
  return issues;
}

module.exports={checkRegionalCoverage};
if (require.main===module) {
  const root=path.resolve(__dirname,'..');
  const {regionalVariants:regions}=loadShared('catalog.ts');
  const read=filename=>fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):undefined;
  const inventory=read(path.join(root,'src/regional/inventory.json'));
  const packs={},docs={};
  for (const region of regions) {
    packs[region.id]=read(path.join(root,`shared/regional/packs/${region.id}.json`));
    docs[region.id]=read(path.join(root,`src/regional/docs/${region.id}.json`));
  }
  const issues=checkRegionalCoverage({regions,inventory,packs,docs});
  if (issues.length) {
    console.error(`Regional interface NOT release-ready: ${issues.length} issue(s).`);
    for (const issue of issues.slice(0,15)) console.error(`- ${issue}`);
    console.error('Complete report available via checkRegionalCoverage; no fallback is counted as translated content.');
    process.exitCode=1;
  } else console.log(`Regional interface coverage PASS: ${regions.length} complete variants.`);
}
