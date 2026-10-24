import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
import {mkdtemp,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
const require=createRequire(import.meta.url);

describe('bundled speech archive integrity',()=>{
  it('rejects changed bytes before they can be extracted',()=>{
    const {verifyBytes}=require('./prepare-bundled-speech.cjs');
    expect(()=>verifyBytes(Buffer.from('broken'),{sha256:'0'.repeat(64),size:6})).toThrow();
  });
  it('rejects archive traversal even when ZIP normalizes the entry name',async()=>{
    const {extractZip}=require('./prepare-bundled-speech.cjs');
    const zip=new JSZip();zip.file('../escape.txt','bad');
    const root=path.join(await mkdtemp(path.join(os.tmpdir(),'bundled-speech-')),'inside');
    await expect(extractZip(await zip.generateAsync({type:'nodebuffer'}),root)).rejects.toThrow();
  });
  it('extracts legitimate Unicode paths without a shell',async()=>{
    const {extractZip}=require('./prepare-bundled-speech.cjs');
    const zip=new JSZip();zip.file('Sprache/Grüße.txt','Guten Tag.');
    const root=await mkdtemp(path.join(os.tmpdir(),'bundled-speech-'));
    await extractZip(await zip.generateAsync({type:'nodebuffer'}),root);
    expect(await readFile(path.join(root,'Sprache/Grüße.txt'),'utf8')).toBe('Guten Tag.');
  });
});
