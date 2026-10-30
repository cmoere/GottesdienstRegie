'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const pkg=read('package.json'),build=read('public/releases.json').versions[0].builds[0];
assert(Number(pkg.version.split('.')[1])>=86);assert.equal(build.version,pkg.version);assert.equal(build.current,true);
assert.equal(read('package-lock.json').version,pkg.version);
if(Number(pkg.version.split('.')[1])>=95){
 const completion=require('./check-v95-regional-completion.cjs').checkV95Completion(root);
 assert.equal(completion.complete,true,JSON.stringify(completion.issues));
 assert.equal(completion.regions,31);
}else{
 assert.equal(read('shared/regional/availability.json').partialRelease.version,pkg.version);
 assert(build.sections.known.some(item=>item.text.de.includes('Regionalvarianten sind noch nicht vollständig übersetzt.')));
}
if(Number(pkg.version.split('.')[1])<94)assert(build.sections.known.some(item=>item.text.de.includes('PowerPoint')&&item.text.de.includes('deaktiviert')));
else assert(build.sections.known.some(item=>item.text.de.includes('Windows')&&item.text.de.includes('installiertes Microsoft PowerPoint')));
for(const name of ['wdr','westfalen-blatt'])assert(fs.existsSync(path.join(root,'public/news-logos',name+'.svg')));
const result=spawnSync(process.execPath,[path.join(root,'node_modules/vitest/vitest.mjs'),'run','src/externalLoop','electron/externalLoop','src/clockLoop','src/technicalIssueLanguage.test.tsx','src/technicalQuickScreen.test.tsx','src/quickScreenUi.test.ts','src/screenTest.test.ts','src/regional/availability.test.ts','src/releaseWorkflow.test.ts','src/releaseAssets.test.ts','--maxWorkers=2','--minWorkers=1'],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);
console.log('V86 external loop, clock, quick-screen and disclosed regional-scope guards passed.');
