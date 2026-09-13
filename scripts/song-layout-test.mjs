import assert from 'node:assert/strict';
import { estimateLyricLines, hasLyricOverflow, splitLyrics } from '../src/songLayout.ts';
import { stageChordRows } from '../src/songStructure.ts';

assert.equal(estimateLyricLines('A\nB\nC', { charactersPerLine: 40 }), 3);
assert.deepEqual(splitLyrics('A\nB\nC\nD', { maxLines: 2 }), ['A\nB', 'C\nD']);
assert.deepEqual(splitLyrics('A\n\nB\n\nC', { maxLines: 2 }), ['A\nB', 'C']);
assert.equal(hasLyricOverflow('A\nB\nC', { maxLines: 2 }), true);
assert.equal(hasLyricOverflow('A\nB', { maxLines: 2 }), false);
assert.deepEqual(stageChordRows('Amazing grace\nhow sweet the sound', '[G]      [D]\n[C]      [G]'), [
  { chords: '[G]      [D]', lyrics: 'Amazing grace' },
  { chords: '[C]      [G]', lyrics: 'how sweet the sound' },
]);
console.log('song-layout: PASS');
