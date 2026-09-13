import assert from 'node:assert/strict';
import {
  WEATHER_SCREEN_DURATION_MS,
  canPlaceItem,
  isLoopSection,
  loopDurationMs,
  LoopController,
} from '../src/loopDomain.ts';

const pre = { id: 'pre', title: 'PRE-LOOP', type: 'preLoop', autoLoop: true, supportsLoopItems: true };
const service = { id: 'service', title: 'GOTTESDIENST', type: 'service', autoLoop: false, supportsLoopItems: false };
const announcement = { id: 'a', type: 'announcement', itemCategory: 'loop', placementPolicy: 'loopOnly', durationMs: 15000 };
const weather = { id: 'w', type: 'weather', itemCategory: 'loop', placementPolicy: 'loopOnly', durationMs: 60000 };

assert.equal(isLoopSection(pre), true);
assert.equal(isLoopSection(service), false);
assert.equal(canPlaceItem(announcement, pre), true);
assert.equal(canPlaceItem(announcement, service), false);
assert.equal(loopDurationMs(weather), 60_000, 'Wetterdauer darf die Empfehlung überschreiben');
assert.equal(loopDurationMs({ ...weather, durationMs: WEATHER_SCREEN_DURATION_MS }), WEATHER_SCREEN_DURATION_MS);

const controller = new LoopController([
  { id: 'empty', ready: false, durationMs: 1000 },
  { id: 'ready', ready: true, durationMs: 1000 },
]);
assert.equal(controller.start(), 'ready');
assert.equal(controller.advance(), 'ready');
controller.stop();
assert.equal(controller.current(), null);

console.log('loop-domain: PASS');
