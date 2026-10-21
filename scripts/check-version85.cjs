'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {generateReleaseFeed}=require('./generate-release-feed.cjs');
const root=path.resolve(__dirname,'..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const catalog=read('public/releases.json'),pkg=read('package.json');
assert.ok(Number(pkg.version.split('.')[1])>=85);
assert.equal(catalog.versions[0].builds[0].version,pkg.version);
assert.equal(read('package-lock.json').version,pkg.version);
assert.equal(fs.readFileSync(path.join(root,'public/release-notes/feed.xml'),'utf8').replace(/\r\n/g,'\n'),generateReleaseFeed(catalog),'RSS feed must match the shipped release catalog');
const page=fs.readFileSync(path.join(root,'public/release-notes/index.html'),'utf8');
assert.match(page,/rel="alternate" type="application\/rss\+xml"/);
assert.match(page,/href="feed\.xml"[^>]*>RSS</);
const result=spawnSync(process.execPath,[path.join(root,'node_modules/vitest/vitest.mjs'),'run',
 'src/announcementRibbon.test.tsx','src/announcementScroll.test.tsx',
 'src/postProgramLiveProtection.test.ts','src/liveCountdown.test.ts',
 'src/LiveTakeMetadata.test.ts','src/ServiceCountdownBadge.test.tsx',
 'src/technicalQuickScreen.test.tsx','src/addElementCatalog.test.ts',
 'src/releaseFeed.test.ts','src/OutputComposition.test.tsx','--maxWorkers=2'],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
console.log('V85 announcement, navigation, emergency overlay and RSS guards passed.');
