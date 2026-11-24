/** Small sampled RGBA frames are clustered locally, without an external model. */
export function dominantFrameColors(pixels: Uint8ClampedArray): string[] {
  type Cluster = {count: number; r: number; g: number; b: number};
  const bins = new Map<number, Cluster>();
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    if (pixels[index + 3] < 240) continue;
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
    const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
    const bin = bins.get(key) ?? {count: 0, r: 0, g: 0, b: 0};
    bin.count++; bin.r += r; bin.g += g; bin.b += b;
    bins.set(key, bin);
  }
  const clusters: Cluster[] = [];
  const distance = (a: Cluster, b: Cluster) =>
    (a.r / a.count - b.r / b.count) ** 2
    + (a.g / a.count - b.g / b.count) ** 2
    + (a.b / a.count - b.b / b.count) ** 2;
  const ranked = [...bins.values()].sort((a, b) => b.count - a.count).slice(0, 128);
  for (const bin of ranked) {
    const cluster = clusters.find(candidate => distance(candidate, bin) < 48 ** 2);
    if (cluster) {
      cluster.count += bin.count; cluster.r += bin.r; cluster.g += bin.g; cluster.b += bin.b;
    } else clusters.push({...bin});
  }
  clusters.sort((a, b) => b.count - a.count);
  const primary = clusters[0];
  if (!primary) return [];
  const secondary = clusters.find(cluster => distance(primary, cluster) >= 64 ** 2);
  const selected = secondary ? [primary, secondary] : [primary];
  return selected.map(color => '#' + [color.r, color.g, color.b]
    .map(value => Math.round(value / color.count).toString(16).padStart(2, '0')).join('').toUpperCase());
}
