import {describe, expect, it} from 'vitest';
import {DuckingClaims} from './DuckingClaims';

describe('independent relative ducking claims', () => {
  it('uses the minimum claim and releases only the named source', () => {
    const claims = new DuckingClaims();
    expect(claims.factor()).toBe(1);
    claims.set('announcement', .2);
    claims.set('video', .1);
    expect(claims.factor()).toBe(.1);
    claims.delete('announcement');
    expect(claims.factor()).toBe(.1);
    claims.delete('video');
    expect(claims.factor()).toBe(1);
  });

  it('updates an existing claim without stacking it', () => {
    const claims = new DuckingClaims();
    claims.set('announcement', 0);
    expect(claims.factor()).toBe(0);
    claims.set('announcement', .4);
    expect(claims.factor()).toBe(.4);
    claims.delete('announcement');
    expect(claims.factor()).toBe(1);
  });

  it.each([NaN, Infinity, -.1, 1.1])('rejects invalid factor %s without changing claims', value => {
    const claims = new DuckingClaims();
    claims.set('video', .3);
    expect(() => claims.set('announcement', value)).toThrow();
    expect(claims.factor()).toBe(.3);
  });
});
