const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const {collectGermanResources}=require('./inventory-regional-texts.cjs');

/** Evaluate only this checkout's data modules; no package/network/process access. */
function loadLocalDataModule(root,entry){
  const cache=new Map();
  function load(filename){
    const absolute=path.resolve(filename);
    const relative=path.relative(root,absolute);
    if(relative==='..'||relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative))throw Error('DATA_MODULE_OUTSIDE_WORKTREE');
    if(cache.has(absolute))return cache.get(absolute);
    if(absolute.endsWith('.json')){
      const json=JSON.parse(fs.readFileSync(absolute,'utf8'));
      cache.set(absolute,json);return json;
    }
    if(!absolute.endsWith('.ts'))throw Error(`UNSUPPORTED_DATA_MODULE: ${relative}`);
    const source=fs.readFileSync(absolute,'utf8');
    const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
    const module={exports:{}};
    cache.set(absolute,module.exports);
    const requireLocal=request=>{
      if(!request.startsWith('.'))throw Error(`EXTERNAL_MODULE_NOT_ALLOWED: ${request}`);
      const base=path.resolve(path.dirname(absolute),request);
      const dependency=[base,`${base}.ts`,`${base}.json`,path.join(base,'index.ts')].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
      if(!dependency)throw Error(`MISSING_DATA_MODULE: ${request}`);
      return load(dependency);
    };
    vm.runInNewContext(result.outputText,{module,exports:module.exports,require:requireLocal},{filename:absolute,timeout:5000});
    cache.set(absolute,module.exports);
    return module.exports;
  }
  return load(path.join(root,entry));
}

function getGermanDocumentationSource(root){
  root=path.resolve(root);
  const catalog=loadLocalDataModule(root,'src/help/base.ts').getHelpCatalog('de');
  const help=Object.fromEntries(catalog.topics.map(article=>[article.id,{
    title:article.title,body:article.body,...(article.related?{related:[...article.related]}:{}),
  }]));
  const releases=JSON.parse(fs.readFileSync(path.join(root,'public/releases.json'),'utf8'));
  return {help,helpUI:{...catalog.ui},releases:Object.fromEntries(collectGermanResources(releases).map(row=>[row.key,row.text]))};
}

module.exports={getGermanDocumentationSource,loadLocalDataModule};
if(require.main===module){
  const root=path.resolve(__dirname,'..');
  const source=getGermanDocumentationSource(root);
  const destination=path.join(root,'work/v84-regional-source.json');
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,JSON.stringify(source,null,2)+'\n');
  console.log(JSON.stringify({destination,helpArticles:Object.keys(source.help).length,releaseFields:Object.keys(source.releases).length,
    helpCharacters:JSON.stringify(source.help).length,releaseCharacters:JSON.stringify(source.releases).length}));
}
