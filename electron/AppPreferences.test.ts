import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {expect,it} from 'vitest';
import {AppPreferences} from './AppPreferences';

it('keeps Windows login actions disabled for old or malformed preferences and persists explicit booleans',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'regie-prefs-'));
  try{
    const file=path.join(dir,'preferences.json');
    await writeFile(file,JSON.stringify({openAtLogin:'true',checkUpdatesAtLogin:1}));
    const prefs=new AppPreferences(file);
    expect(await prefs.load()).toMatchObject({openAtLogin:false,checkUpdatesAtLogin:false});
    await prefs.update({openAtLogin:true,checkUpdatesAtLogin:true});
    expect(await new AppPreferences(file).load()).toMatchObject({openAtLogin:true,checkUpdatesAtLogin:true});
  }finally{await rm(dir,{recursive:true,force:true})}
});
