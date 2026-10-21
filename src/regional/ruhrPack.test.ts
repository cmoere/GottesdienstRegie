import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import inventory from './inventory.json';
import { formatRegionalTemplate, validateRegionalPack } from '../../shared/regional/validation';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';
import {germanBaseTemplates} from '../i18nBase';

describe('authored Ruhrdeutsch base-interface resources',()=>{
  it('supplies every existing base-interface key explicitly, with intact placeholders',()=>{
    const candidate=JSON.parse(readFileSync(path.resolve('shared/regional/packs/ruhr.json'),'utf8'));
    const ui=Object.fromEntries(inventory.entries.filter(entry=>entry.key.startsWith('ui.'))
      .map(entry=>[entry.key.slice(3),entry.text]));
    expect(Object.keys(ui).sort()).toEqual(Object.keys(germanBaseTemplates).sort());
    expect(validateRegionalPack(candidate,'ruhr',{ui,native:nativeBaseTemplates})).toEqual([]);
  });
  it('contains actual regional update and login text instead of inheriting German defaults',()=>{
    const candidate=JSON.parse(readFileSync(path.resolve('shared/regional/packs/ruhr.json'),'utf8'));
    expect(candidate.ui.updateChecking).toBe('Wir gucken nach Updates …');
    expect(formatRegionalTemplate(candidate.ui.updateDownloaded,{version:'0.84.0'}))
      .toBe('Version 0.84.0 is fertig zum Installieren.');
    expect(candidate.ui.authNoAccess).toContain('Administrator');
    expect(candidate.ui.authNoAccess).toContain('keinen freigeschalteten GottesdienstRegie-Zugang');
  });
});
