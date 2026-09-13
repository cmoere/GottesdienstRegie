export interface Rect { x: number; y: number; width: number; height: number }
export interface CanvasBounds { width: number; height: number }
export type AlignMode = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function snapValue(value: number, grid: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(grid) || grid <= 1) return value;
  return Math.round(value / grid) * grid;
}

export function snapRect(rect: Rect, options: { grid: number; enabled: boolean; bounds: CanvasBounds }): Rect {
  const width = Math.max(1, snapValue(rect.width, options.grid, options.enabled));
  const height = Math.max(1, snapValue(rect.height, options.grid, options.enabled));
  return {
    x: clamp(snapValue(rect.x, options.grid, options.enabled), 0, Math.max(0, options.bounds.width - width)),
    y: clamp(snapValue(rect.y, options.grid, options.enabled), 0, Math.max(0, options.bounds.height - height)),
    width: Math.min(width, options.bounds.width),
    height: Math.min(height, options.bounds.height),
  };
}

export function snapPosition(rect: Rect, options: { grid: number; enabled: boolean; guides?: boolean; bounds: CanvasBounds }): Rect {
  let x = snapValue(rect.x, options.grid, options.enabled);
  let y = snapValue(rect.y, options.grid, options.enabled);
  if (options.guides) {
    const centerX = (options.bounds.width - rect.width) / 2;
    const centerY = (options.bounds.height - rect.height) / 2;
    if (Math.abs(x - centerX) <= 12) x = centerX;
    if (Math.abs(y - centerY) <= 12) y = centerY;
    if (Math.abs(x) <= 12) x = 0;
    if (Math.abs(y) <= 12) y = 0;
    if (Math.abs(x + rect.width - options.bounds.width) <= 12) x = options.bounds.width - rect.width;
    if (Math.abs(y + rect.height - options.bounds.height) <= 12) y = options.bounds.height - rect.height;
  }
  return { ...rect, x: clamp(x, 0, Math.max(0, options.bounds.width - rect.width)), y: clamp(y, 0, Math.max(0, options.bounds.height - rect.height)) };
}

export function alignRects(rects: Rect[], mode: AlignMode): Rect[] {
  if (rects.length < 2) return rects.map(rect => ({ ...rect }));
  const reference = mode === 'left' ? Math.min(...rects.map(rect => rect.x))
    : mode === 'right' ? Math.max(...rects.map(rect => rect.x + rect.width))
      : mode === 'top' ? Math.min(...rects.map(rect => rect.y))
        : mode === 'bottom' ? Math.max(...rects.map(rect => rect.y + rect.height))
          : mode === 'centerX' ? (Math.min(...rects.map(rect => rect.x)) + Math.max(...rects.map(rect => rect.x + rect.width))) / 2
            : (Math.min(...rects.map(rect => rect.y)) + Math.max(...rects.map(rect => rect.y + rect.height))) / 2;
  return rects.map(rect => {
    if (mode === 'left') return { ...rect, x: reference };
    if (mode === 'right') return { ...rect, x: reference - rect.width };
    if (mode === 'top') return { ...rect, y: reference };
    if (mode === 'bottom') return { ...rect, y: reference - rect.height };
    if (mode === 'centerX') return { ...rect, x: reference - rect.width / 2 };
    return { ...rect, y: reference - rect.height / 2 };
  });
}

export function distributeRects(rects: Rect[], axis: 'horizontal' | 'vertical'): Rect[] {
  if (rects.length < 3) return rects.map(rect => ({ ...rect }));
  const key = axis === 'horizontal' ? 'x' : 'y';
  const size = axis === 'horizontal' ? 'width' : 'height';
  const sorted = rects.map((rect, index) => ({ rect, index })).sort((a, b) => a.rect[key] - b.rect[key]);
  const first = sorted[0].rect[key];
  const last = sorted[sorted.length - 1].rect[key];
  const lastEnd = last + sorted[sorted.length - 1].rect[size];
  const totalSize = sorted.reduce((sum, entry) => sum + entry.rect[size], 0);
  const gap = (lastEnd - first - totalSize) / (sorted.length - 1);
  let cursor = first;
  const output = rects.map(rect => ({ ...rect }));
  sorted.forEach(({ rect, index }) => {
    output[index] = axis === 'horizontal' ? { ...rect, x: cursor } : { ...rect, y: cursor };
    cursor += rect[size] + gap;
  });
  return output;
}

export function nudgeRect(rect: Rect, key: string, amount: number, bounds: CanvasBounds): Rect {
  const dx = key === 'ArrowLeft' ? -amount : key === 'ArrowRight' ? amount : 0;
  const dy = key === 'ArrowUp' ? -amount : key === 'ArrowDown' ? amount : 0;
  return { ...rect, x: clamp(rect.x + dx, 0, Math.max(0, bounds.width - rect.width)), y: clamp(rect.y + dy, 0, Math.max(0, bounds.height - rect.height)) };
}
