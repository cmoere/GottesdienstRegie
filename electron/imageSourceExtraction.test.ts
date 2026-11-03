import {createRequire} from 'node:module';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import JSZip from 'jszip';import {expect,it} from 'vitest';
const runtimeRequire=createRequire(path.join(process.cwd(),'electron/imageSourceExtraction.test.cjs'));
it('extracts pinned build sources while omitting unused repository symlinks',async()=>{
 const {extractSourceZip}=runtimeRequire('../scripts/prepare-image-ai.cjs'),root=await fs.mkdtemp(path.join(os.tmpdir(),'regie-source-extract-'));
 try{const zip=new JSZip();zip.file('source/CMakeLists.txt','project(image)');zip.file('source/.pi/SYSTEM.md','gg/SYSTEM.md',{unixPermissions:0xa1ff});const bytes=await zip.generateAsync({type:'nodebuffer',platform:'UNIX'});await extractSourceZip(bytes,root);expect(await fs.readFile(path.join(root,'source/CMakeLists.txt'),'utf8')).toBe('project(image)');await expect(fs.lstat(path.join(root,'source/.pi/SYSTEM.md'))).rejects.toThrow()}
 finally{await fs.rm(root,{recursive:true,force:true})}
});
