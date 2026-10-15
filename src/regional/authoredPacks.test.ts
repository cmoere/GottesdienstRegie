import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { germanBaseTemplates } from '../i18nBase';
import { validateRegionalPack } from '../../shared/regional/validation';
import type { GermanRegionId } from '../../shared/regional/catalog';
import {nativeBaseTemplates} from '../../shared/regional/nativeBase';

describe.each<GermanRegionId>(['berlin','bavarian-upper'])('%s authored base-interface resource',id=>{
  it('has explicit complete base-interface coverage and preserves security/update placeholders',()=>{
    const candidate=JSON.parse(readFileSync(path.resolve(`shared/regional/packs/${id}.json`),'utf8'));
    expect(validateRegionalPack(candidate,id,{ui:germanBaseTemplates,native:nativeBaseTemplates})).toEqual([]);
    expect(Object.keys(candidate.ui)).toHaveLength(195);
    expect(candidate.ui.authNoAccess).toContain('Administrator');
    expect(candidate.ui.updateAvailable).toContain('{version}');
    expect(candidate.ui.updateDownloading).toContain('{percent}');
  });
});
