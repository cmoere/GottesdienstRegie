// CommonJS adapter for historical release guards, including Vite's local JSON globs.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function createLegacyLoader(parent){
  const cache=new Map();
  function load(relative){
    const file=path.resolve(relative);
    if(cache.has(file))return cache.get(file).exports;
    if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
    const mod=new Module(file,parent);
    mod.paths=Module._nodeModulePaths(path.dirname(file));cache.set(file,mod);
    const original=mod.require.bind(mod);
    mod.require=id=>id.startsWith('.')?load(path.resolve(path.dirname(file),/\.(ts|tsx|json)$/.test(id)?id:`${id}.ts`)):original(id);
    const source=fs.readFileSync(file,'utf8').replace(/import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*,\s*\{\s*import\s*:\s*(['"])default\3\s*\}\s*\)/g,(_match,_quote,pattern)=>{
      if(!pattern.endsWith('/*.json')||pattern.slice(0,-7).includes('*'))throw Error('UNSUPPORTED_LEGACY_GLOB');
      const directory=path.resolve(path.dirname(file),pattern.slice(0,-7));
      const entries=fs.readdirSync(directory).filter(name=>name.endsWith('.json')).sort();
      return `{${entries.map(name=>`${JSON.stringify(pattern.replace('*',name.slice(0,-5)))}:()=>Promise.resolve(require(${JSON.stringify(path.join(directory,name))}))`).join(',')}}`;
    });
    // Generated glob paths are absolute; allow only these local JSON imports.
    mod.require=id=>path.isAbsolute(id)&&id.endsWith('.json')?load(id):id.startsWith('.')?load(path.resolve(path.dirname(file),/\.(ts|tsx|json)$/.test(id)?id:`${id}.ts`)):original(id);
    mod._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
    return mod.exports;
  }
  return load;
}
module.exports={createLegacyLoader};
