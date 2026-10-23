const assert=require('node:assert/strict');
function assertReleaseAssets(assets,version){
 assert(/^\d+\.\d+\.\d+$/.test(version));assert(Array.isArray(assets));
 const expected=['GottesdienstRegie-Setup-'+version+'.exe','GottesdienstRegie-Setup-'+version+'.exe.blockmap','latest.yml','latest-mac.yml','latest-linux.yml','GottesdienstRegie-'+version+'-x86_64.AppImage','GottesdienstRegie-'+version+'-amd64.deb'];
 for(const arch of ['x64','arm64'])for(const extension of ['dmg','zip'])expected.push('GottesdienstRegie-'+version+'-'+arch+'.'+extension);
 for(const name of expected)assert(assets.some(asset=>asset?.name===name&&Number.isSafeInteger(asset.size)&&asset.size>0),'Missing or empty release asset: '+name);
}
module.exports={assertReleaseAssets};
if(require.main===module){const fs=require('node:fs'),value=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));assertReleaseAssets(value.assets,process.argv[3]);console.log('All platform binaries and update manifests are present and nonempty.')}
