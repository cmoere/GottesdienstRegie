/** Relative attenuation claims: releasing one owner never releases another. */
export class DuckingClaims {
  private readonly claims = new Map<string, number>();

  set(source: string, factor: number): void {
    if (!Number.isFinite(factor) || factor < 0 || factor > 1)
      throw new RangeError('Ungültiger relativer Audiopegel.');
    this.claims.set(source, factor);
  }

  delete(source: string): void {
    this.claims.delete(source);
  }

  factor(): number {
    let factor = 1;
    for (const claim of this.claims.values()) factor = Math.min(factor, claim);
    return factor;
  }
}
