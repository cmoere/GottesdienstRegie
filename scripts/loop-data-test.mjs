import assert from 'node:assert/strict';
import { filterAnnouncements, normalizeAnnouncement, validateAnnouncement } from '../src/loopData.ts';

const now = new Date('2026-09-13T10:00:00Z');
const raw = { titel: 'Parkplatz', textMeldung: 'Bitte hinten parken.', status: 'öffentlich', messageScreen: true, giltAb: '2026-09-13T09:00:00Z', giltBis: '2026-09-13T12:00:00Z', placements: ['preLoop'], audience: 'public' };
const item = normalizeAnnouncement('stable-id', raw);
assert.equal(item.id, 'stable-id');
assert.equal(validateAnnouncement(item, now, 'preLoop'), true);
assert.equal(filterAnnouncements({ a: raw }, now, 'postLoop').length, 0);
assert.equal(filterAnnouncements({ a: { ...raw, audience: 'internal' } }, now, 'preLoop').length, 0);
assert.equal(filterAnnouncements({}, now, 'preLoop').length, 0);
console.log('loop-data: PASS');
