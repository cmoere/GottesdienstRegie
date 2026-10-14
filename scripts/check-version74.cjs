const fs=require('fs'),assert=require('assert');
const pkg=require('../package.json'),releases=require('../public/releases.json'),read=file=>fs.readFileSync(file,'utf8');
assert(Number(pkg.version.split('.')[1])>=74,'package must include V74');
assert(releases.versions.some(entry=>entry.builds?.some(build=>build.version==='0.74.0')),'catalog must retain V74');
assert(read('RELEASE_NOTES.md').includes('# GottesdienstRegie 0.74.0'),'notes must retain V74');
const firebase=read('electron/FirebaseGemeindeService.ts'),rooms=read('src/community/RoomService.ts'),post=read('src/community/PostProgramRoomNoticeService.ts'),mode=read('src/appMode.ts'),app=read('src/App.tsx');
for(const path of ['veranstaltungen','meldungen','rooms'])assert(firebase.includes(`watchChildren('${path}'`),`central ${path} child watcher missing`);
assert(rooms.includes('function flatten(')&&rooms.includes('roomsById'),'recursive stable room resolution missing');
assert(post.includes('61*60_000')&&post.includes("type:'leave-room'")&&post.includes('location.roomId!==currentLocation.roomId'),'post-program room boundary logic missing');
assert(mode.includes("mode:'normal'|'test'")&&mode.includes('onAir:boolean'),'independent app mode state missing');
// The overlay is composed through a React prop; source-string order does not
// describe paint order. Exercise the actual render contract instead.
require('node:child_process').execFileSync(process.execPath,[require('node:path').join(require('node:path').dirname(require.resolve('vitest/package.json')),'vitest.mjs'),'run','src/TestModeWatermark.test.tsx','src/OutputComposition.test.tsx','--maxWorkers=2'],{stdio:'inherit'});
console.log('V74 release guard passed.');
