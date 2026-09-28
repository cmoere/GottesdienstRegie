import type { SpotifyTrackReference } from '../src/spotify/types';

const TRACK_ID = /^[A-Za-z0-9]{6,64}$/;

export function normalizeSpotifyTrackUrl(input: string) {
  let url: URL;
  try { url = new URL(String(input).trim()); } catch { throw new Error('INVALID_SPOTIFY_URL'); }
  const parts = url.pathname.split('/').filter(Boolean);
  if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' || parts.length !== 2 || parts[0] !== 'track' || !TRACK_ID.test(parts[1])) {
    throw new Error('INVALID_SPOTIFY_URL');
  }
  const trackId = parts[1];
  return { trackId, url: `https://open.spotify.com/track/${trackId}` };
}

export class SpotifyOEmbedService {
  constructor(private readonly request: typeof fetch = fetch) {}

  async resolve(input: string): Promise<SpotifyTrackReference> {
    const normalized = normalizeSpotifyTrackUrl(input);
    const endpoint = new URL('https://open.spotify.com/oembed');
    endpoint.searchParams.set('url', normalized.url);
    const response = await this.request(endpoint.toString(), { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`SPOTIFY_OEMBED_FAILED_${response.status}`);
    const data = await response.json() as Record<string, unknown>;
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (data.provider_name !== 'Spotify' || !title) throw new Error('SPOTIFY_OEMBED_INVALID');
    const imageUrl = typeof data.thumbnail_url === 'string' && /^https:\/\//i.test(data.thumbnail_url) ? data.thumbnail_url : undefined;
    return {
      provider: 'spotify', id: normalized.trackId, title, artists: [],
      ...(imageUrl ? { imageUrl } : {}), externalUrl: normalized.url, uri: `spotify:track:${normalized.trackId}`,
    };
  }
}
