// Read/download verification only. Never executes or installs release assets.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),yaml=require('js-yaml');
const root=path.resolve(__dirname,'..'),version=process.argv[2]??require('../package.json').version;
assert(/^\d+\.\d+\.\d+$/.test(version));const base='https://api.github.com/repos/cmoere/GottesdienstRegie';
async function response(url,timeout=20000){const result=await fetch(url,{signal:AbortSignal.timeout(timeout),headers:{'User-Agent':'GottesdienstRegie-release-verification'}});assert(result.ok,'HTTP '+result.status+' '+url);return result}
async function json(url){return(await response(url)).json()}
(async()=>{
 const release=await json(base+'/releases/tags/v'+version),latest=await json(base+'/releases/latest');
 assert.equal(release.draft,false);assert.equal(release.prerelease,false);assert.equal(latest.tag_name,'v'+version);
 const tag=await json(base+'/git/ref/tags/v'+version);
 const assets=release.assets;assert(assets.length>=11,'All platform assets must be present');assert(assets.every(asset=>asset.size>0));
 const manifests={};
 for(const name of ['latest.yml','latest-mac.yml','latest-linux.yml']){
  const asset=assets.find(entry=>entry.name===name);assert(asset,'Missing '+name);
  const manifest=yaml.load(await(await response(asset.browser_download_url)).text());assert.equal(manifest.version,version);
  for(const entry of manifest.files??[]){const match=assets.find(asset=>asset.name===decodeURIComponent(entry.url));assert(match,'Missing manifest asset '+entry.url);assert.equal(match.size,entry.size)}
  manifests[name]=manifest;
 }
 const installer=assets.find(asset=>asset.name==='GottesdienstRegie-Setup-'+version+'.exe');assert(installer);
 assert(assets.some(asset=>asset.name===installer.name+'.blockmap'));
 const expected=manifests['latest.yml'].files.find(entry=>decodeURIComponent(entry.url)===installer.name);assert(expected);
 const folder=await fs.mkdtemp(path.join(root,'work/release-verify-')),target=path.join(folder,installer.name);
 const file=await fs.open(target,'wx'),sha512=crypto.createHash('sha512'),sha256=crypto.createHash('sha256');let size=0;
 try{const reader=(await response(installer.browser_download_url,180000)).body.getReader();for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;assert(size<=installer.size,'Unexpected oversized installer');sha512.update(part.value);sha256.update(part.value);await file.write(part.value)}}finally{await file.close()}
 const digest512=sha512.digest('base64'),digest256=sha256.digest('hex');assert.equal(size,installer.size);assert.equal((await fs.stat(target)).size,size);assert.equal(digest512,expected.sha512);
 if(installer.digest)assert.equal(installer.digest,'sha256:'+digest256);
 const feed=await(await response('https://cmoere.github.io/GottesdienstRegie/release-notes/feed.xml')).text();assert(feed.includes('GottesdienstRegie '+version),'Public RSS must contain release');
 const report={version,url:release.html_url,sourceTagSha:tag.object.sha,targetCommitish:release.target_commitish,normalLatest:true,assets:assets.map(({name,size})=>({name,size})),installer:{path:target,size,sha512:digest512,sha256:digest256},rssVerified:true,installerExecuted:false,verifiedAt:new Date().toISOString()};
 await fs.writeFile(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1});
