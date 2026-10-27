'use strict';
const path=require('node:path');
const fs=require('node:fs/promises');

/** Bundle imports before the sandboxed preload runs: its require only supports
 * Electron, not adjacent application modules. Native handles stay in Main. */
async function bundleDesktopRuntime({root=path.resolve(__dirname,'..'),outdir=path.join(root,'dist-electron')}={}){
 await require('esbuild').build({
  entryPoints:[path.join(root,'electron/preload.ts')],
  outfile:path.join(outdir,'electron/preload.js'),
  bundle:true,platform:'node',format:'cjs',target:'es2022',external:['electron'],
 });
 const runtime=path.join(outdir,'electron/powerpoint-runtime');
 await fs.mkdir(runtime,{recursive:true});
 for(const name of ['producer-client.cjs','frame-broker.cjs','managed-texture.cjs']){
  await fs.copyFile(path.join(root,'scripts/powerpoint-gpu-probe',name),path.join(runtime,name));
 }
}
module.exports={bundleDesktopRuntime};
if(require.main===module)bundleDesktopRuntime().catch(error=>{console.error(error);process.exitCode=1});
