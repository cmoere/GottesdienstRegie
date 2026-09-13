import { WEATHER_SCREEN_DURATION_MS, WEATHER_SCREEN_URL } from './loopDomain';

export type WeatherState = 'LOADING' | 'READY' | 'STALE' | 'OFFLINE' | 'ERROR';

export interface WeatherSnapshot { state: WeatherState; url: string; durationMs: number; loadedAt?: number; error?: string }

export class WeatherScreenController {
  private state: WeatherState = 'LOADING';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private token = 0;

  snapshot(): WeatherSnapshot { return { state: this.state, url: WEATHER_SCREEN_URL, durationMs: WEATHER_SCREEN_DURATION_MS }; }

  async preload(fetcher: (url: string) => Promise<boolean> = async (url) => { const response = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return response.ok; }): Promise<boolean> {
    this.state = 'LOADING';
    try {
      const ready = await fetcher(WEATHER_SCREEN_URL);
      this.state = ready ? 'READY' : 'ERROR';
      return ready;
    } catch {
      this.state = 'OFFLINE';
      return false;
    }
  }

  take(onComplete: () => void, durationMs = WEATHER_SCREEN_DURATION_MS): boolean {
    if (this.state !== 'READY') return false;
    this.cancel();
    const token = ++this.token;
    this.state = 'READY';
    const duration = Math.max(1000, Number.isFinite(durationMs) ? durationMs : WEATHER_SCREEN_DURATION_MS);
    this.timer = setTimeout(() => { if (token !== this.token) return; this.timer = undefined; onComplete(); }, duration);
    return true;
  }

  cancel(): void {
    this.token += 1;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}

export const weatherScreenController = new WeatherScreenController();
