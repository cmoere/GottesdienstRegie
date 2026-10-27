'use strict';
function currentReleaseNotes(markdown,version){
 if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('RELEASE_NOTES_VERSION');
 const current=String(markdown).replaceAll('\r\n','\n').split('\n---\n')[0].trim();
 if(!current.startsWith('# GottesdienstRegie '+version+'\n'))throw Error('RELEASE_NOTES_VERSION');
 if(current.length+1>125000)throw Error('RELEASE_NOTES_SIZE');
 return current+'\n';
}
module.exports={currentReleaseNotes};
if(require.main===module){
 try{const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');process.stdout.write(currentReleaseNotes(fs.readFileSync(path.join(root,'RELEASE_NOTES.md'),'utf8'),process.argv[2]??require('../package.json').version))}
 catch(error){console.error(error.message);process.exitCode=1}
}
