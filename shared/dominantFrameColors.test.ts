import {expect, it} from 'vitest';
import {dominantFrameColors} from './dominantFrameColors';

function frame(...colors: [number, number, number, number][]) {
  return new Uint8ClampedArray(colors.flat());
}

it('finds the two distinct dominant colors and merges small compression variations', () => {
  const pixels = frame(...Array(80).fill([104, 159, 62, 255]), ...Array(30).fill([96, 143, 154, 255]),
    ...Array(15).fill([106, 160, 63, 255]), [255, 0, 0, 255]);
  const result = dominantFrameColors(pixels);
  expect(result).toHaveLength(2);
  expect(result[0]).toMatch(/^#6[89]9[Ff]3[EeFf]$/i);
  expect(result[1]).toBe('#608F9A');
});

it('preserves intentional black and white and reports a single solid color honestly', () => {
  expect(dominantFrameColors(frame([0, 0, 0, 255], [255, 255, 255, 255]))).toEqual(['#000000', '#FFFFFF']);
  expect(dominantFrameColors(frame([0, 0, 0, 255], [0, 0, 0, 255]))).toEqual(['#000000']);
  expect(dominantFrameColors(frame([255, 0, 0, 0]))).toEqual([]);
});

it('runs as a standalone browser function without module dependencies', () => {
  const run = new Function('return (' + dominantFrameColors.toString() + ')')();
  expect(run(frame([96, 143, 154, 255]))).toEqual(['#608F9A']);
});
