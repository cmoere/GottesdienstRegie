import {expect, it} from 'vitest';
import {createServiceItem, usePresentation} from './store';
import {remoteLiveMetadata, remoteUpcomingSlides} from './remoteLiveMetadata';

function presentation() {
 const items = Array.from({length: 7}, (_, index) => {
  const item = createServiceItem('content', {sectionId: 'service'});
  item.order = index;
  item.title = 'Inhalt ' + index;
  item.slides[0].title = 'Folie ' + index;
  return item;
 });
 return {...usePresentation.getState(), items, liveItemId: items[0].id,
  liveSlideId: items[0].slides[0].id, liveTransitionRevision: 12, liveLoopRound: 1};
}

it('prepares four actual slides in live order, skipping disabled content without moving the live take', () => {
 const state = presentation();
 state.items[1].disabled = true;
 state.items[3].slides[0].enabled = false;
 const before = {item: state.liveItemId, slide: state.liveSlideId, round: state.liveLoopRound};
 const upcoming = remoteUpcomingSlides(state);
 expect(upcoming.map(packet => packet.slide.title)).toEqual(['Folie 2', 'Folie 4', 'Folie 5', 'Folie 6']);
 expect({item: state.liveItemId, slide: state.liveSlideId, round: state.liveLoopRound}).toEqual(before);
});

it('uses the current loop forecast as the first preview and continues from that take', () => {
 const state = presentation();
 const target = {itemId: state.items[3].id, slideId: state.items[3].slides[0].id};
 expect(remoteUpcomingSlides(state, {revision: 12, target}).map(packet => packet.slide.title))
  .toEqual(['Folie 3', 'Folie 4', 'Folie 5', 'Folie 6']);
 expect(remoteUpcomingSlides(state, {revision: 11, target})[0].slide.title).toBe('Folie 1');
});

it('returns only remaining slides and preserves the original PowerPoint reference per preview', () => {
 const state = presentation();
 state.liveItemId = state.items[5].id;
 state.liveSlideId = state.items[5].slides[0].id;
 state.items[6].metadata = {...state.items[6].metadata, importMode: 'original', powerPointSourceHash: 'a'.repeat(64)};
 const metadata = remoteLiveMetadata(state, []);
 expect(metadata.upcoming).toHaveLength(1);
 expect(metadata.next).toBe(state.items[6].slides[0]);
 expect(metadata.nextSourceHash).toBe('a'.repeat(64));
 expect(metadata.upcoming[0].sourceHash).toBe(metadata.nextSourceHash);
 expect(remoteUpcomingSlides(state, {revision: 12, target: undefined})).toEqual([]);
});

it('forecasts the first service content after the pre-program countdown', () => {
 const state = presentation();
 const countdown = createServiceItem('countdown', {sectionId: 'pre'});
 const skipped = createServiceItem('content', {sectionId: 'warmup'});
 state.items = [countdown, skipped, ...state.items];
 state.liveItemId = countdown.id;
 state.liveSlideId = countdown.slides[0].id;
 expect(remoteUpcomingSlides(state)[0].slide.id).toBe(state.items[2].slides[0].id);
});
