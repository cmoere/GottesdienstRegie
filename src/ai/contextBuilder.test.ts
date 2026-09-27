import { describe, expect, it } from 'vitest';
import type { CloudMediaAsset } from '../platform/types';
import type { PresentationDocument, ServiceItem, Slide } from '../store';
import { buildAiContext } from './contextBuilder';

const slide = (itemId: string, id: string, body: string): Slide => ({
  id, itemId, order: 0, enabled: true, title: id, body, background: '#000', elements: [],
  transition: 'fade', transitionDuration: 500, notes: 'private slide note', timing: {},
});

const item = (id: string, body = id): ServiceItem => ({
  id, type: 'content', title: id, section: 'GOTTESDIENST', sectionId: 'service', order: Number(id.replace(/\D/g, '')) || 0,
  enabled: true, plannedDuration: 7, metadata: { apiKey: 'secret-key', safe: 'visible' }, slides: [slide(id, `${id}-slide`, body)],
  autoAdvance: false, repeat: false, timing: { mode: 'manual', slideDurationSeconds: 7, autoAdvance: false, repeat: false, shuffle: false, mediaDurationSeconds: 0, totalDurationSeconds: 7 },
  notes: 'private item note', stageDirection: 'private stage direction', createdAt: '2026-01-01', updatedAt: '2026-01-01',
});

const document = (items: ServiceItem[]): PresentationDocument => ({
  presentationId: 'p1', title: 'Sunday', date: '2026-09-27', createdAt: '2026-01-01', updatedAt: '2026-01-01',
  sections: [{ id: 'service', title: 'GOTTESDIENST', order: 0 }], items,
});

describe('buildAiContext', () => {
  it('keeps the selected slide and bounds a large presentation', () => {
    const items = Array.from({ length: 60 }, (_, index) => item(`item-${index}`));
    const context = buildAiContext({ document: document(items), selectedItemId: 'item-59', selectedSlideId: 'item-59-slide', language: 'de', includePresentationContext: true });
    expect(context.truncated).toBe(true);
    expect(context.presentation?.items.length).toBeLessThanOrEqual(30);
    expect(JSON.stringify(context.selection)).toContain('item-59-slide');
    expect(JSON.stringify(context.presentation)).toContain('item-59-slide');
  });

  it('excludes secrets, private notes, and local paths while retaining visible content', () => {
    const unsafe = item('item-1', 'Visible slide text');
    unsafe.metadata = { password: 'pw', authorization: 'Bearer abc', localPath: 'C:\\Users\\Private\\secret.png', safe: 'visible' };
    const media: CloudMediaAsset[] = [{ id: 'm1', name: 'Mountains', path: 'C:\\private.jpg', kind: 'image', size: 10, checksum: 'x', downloadUrl: 'file:///private.jpg', tags: ['nature'] }];
    const serialized = JSON.stringify(buildAiContext({ document: document([unsafe]), media, language: 'de', includePresentationContext: true }));
    expect(serialized).toContain('Visible slide text');
    expect(serialized).toContain('Mountains');
    expect(serialized).not.toMatch(/private slide note|private item note|private stage direction|Bearer abc|C:\\\\Users|file:\/\/|secret\.png|"password"|"authorization"|"path"/i);
  });

  it('omits presentation data when context permission is disabled', () => {
    const context = buildAiContext({ document: document([item('item-1')]), language: 'en', includePresentationContext: false });
    expect(context.presentation).toBeUndefined();
    expect(context.language).toBe('en');
  });
});
