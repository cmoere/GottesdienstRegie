import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

describe('generated terms encoding', () => {
  it('encodes installer terms as UTF-16LE with BOM', () => {
    execFileSync(process.execPath, ['scripts/generate-terms.cjs'], { cwd: root });
    const bytes = fs.readFileSync(path.join(root, 'build/terms.txt'));

    expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xfe]);
  });

  it('round-trips German punctuation without mojibake', () => {
    execFileSync(process.execPath, ['scripts/generate-terms.cjs'], { cwd: root });
    const bytes = fs.readFileSync(path.join(root, 'build/terms.txt'));
    const text = bytes.subarray(2).toString('utf16le');

    expect(text).toContain('für');
    expect(text).toContain('gültig');
    expect(text).toContain('Nutzungsbedingungen');
    expect(text).not.toMatch(/Ã|Â|â€“/);
  });

  it('keeps generated web terms UTF-8', () => {
    execFileSync(process.execPath, ['scripts/generate-terms.cjs'], { cwd: root });
    const html = fs.readFileSync(path.join(root, 'public/terms/index.html'), 'utf8');

    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('Nutzungsbedingungen');
    expect(html).not.toMatch(/Ã|Â|â€“/);
  });
});
