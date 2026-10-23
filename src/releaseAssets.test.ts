import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const {assertReleaseAssets}=createRequire(import.meta.url)('../scripts/check-release-assets.cjs') as {assertReleaseAssets:(assets:Array<{name:string;size:number}>,version:string)=>void};
const version='0.86.0',names=['GottesdienstRegie-Setup-0.86.0.exe','GottesdienstRegie-Setup-0.86.0.exe.blockmap','latest.yml','latest-mac.yml','latest-linux.yml','GottesdienstRegie-0.86.0-x64.dmg','GottesdienstRegie-0.86.0-arm64.dmg','GottesdienstRegie-0.86.0-x64.zip','GottesdienstRegie-0.86.0-arm64.zip','GottesdienstRegie-0.86.0-x86_64.AppImage','GottesdienstRegie-0.86.0-amd64.deb'];
it('refuses publication when any platform asset or update manifest is absent or empty',()=>{
 const assets=names.map(name=>({name,size:100}));
 expect(()=>assertReleaseAssets(assets,version)).not.toThrow();
 for(let i=0;i<assets.length;i++){
  expect(()=>assertReleaseAssets(assets.filter((_,index)=>index!==i),version)).toThrow();
  expect(()=>assertReleaseAssets(assets.map((asset,index)=>index===i?{...asset,size:0}:asset),version)).toThrow();
 }
});
