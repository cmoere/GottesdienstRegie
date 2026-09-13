import assert from 'node:assert/strict';
import { alignRects, distributeRects, nudgeRect, snapPosition, snapRect, snapValue } from '../src/canvasGeometry.ts';

assert.equal(snapValue(127, 16, true), 128);
assert.equal(snapValue(127, 16, false), 127);
assert.equal(snapPosition({ x: 941, y: 400, width: 200, height: 100 }, { grid: 16, enabled: false, guides: true, bounds: { width: 1920, height: 1080 } }).x, 860);
assert.deepEqual(snapRect({ x: 127, y: 63, width: 100, height: 80 }, { grid: 16, enabled: true, bounds: { width: 1920, height: 1080 } }), { x: 128, y: 64, width: 96, height: 80 });
assert.deepEqual(alignRects([{ x: 10, y: 20, width: 40, height: 20 }, { x: 80, y: 60, width: 30, height: 10 }], 'left').map(rect => rect.x), [10, 10]);
assert.deepEqual(distributeRects([{ x: 0, y: 0, width: 10, height: 10 }, { x: 50, y: 0, width: 10, height: 10 }, { x: 120, y: 0, width: 10, height: 10 }], 'horizontal').map(rect => rect.x), [0, 60, 120]);
assert.equal(nudgeRect({ x: 10, y: 10, width: 50, height: 40 }, 'ArrowRight', 10, { width: 1920, height: 1080 }).x, 20);
assert.equal(nudgeRect({ x: 0, y: 0, width: 50, height: 40 }, 'ArrowLeft', 10, { width: 1920, height: 1080 }).x, 0);
console.log('canvas-geometry: PASS');
