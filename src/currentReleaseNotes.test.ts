import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
const runtimeRequire=createRequire(import.meta.url);
it('extracts the complete current notes without historical releases or a cut-off paragraph',()=>{
 const {currentReleaseNotes}=runtimeRequire('../scripts/current-release-notes.cjs');
 expect(currentReleaseNotes('# GottesdienstRegie 0.94.0\r\n\r\nAktuelle Hinweise.\r\n\r\n---\r\n\r\n# GottesdienstRegie 0.93.0\r\nAlt.','0.94.0')).toBe('# GottesdienstRegie 0.94.0\n\nAktuelle Hinweise.\n');
});
it('rejects mismatched versions and oversized current notes rather than silently truncating them',()=>{
 const {currentReleaseNotes}=runtimeRequire('../scripts/current-release-notes.cjs');
 expect(()=>currentReleaseNotes('# GottesdienstRegie 0.93.0\nText','0.94.0')).toThrow('RELEASE_NOTES_VERSION');
 expect(()=>currentReleaseNotes('# GottesdienstRegie 0.94.0\n'+'a'.repeat(125000),'0.94.0')).toThrow('RELEASE_NOTES_SIZE');
});
