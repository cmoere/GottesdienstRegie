import { describe, expect, it, vi } from 'vitest';
import { normalizeSpotifyTrackUrl, SpotifyOEmbedService } from './SpotifyOEmbedService';

const trackId = '4uLU6hMCjMI75M1A2tKUQC';

describe('normalizeSpotifyTrackUrl', () => {
  it('keeps only a canonical HTTPS track URL', () => {
    expect(normalizeSpotifyTrackUrl(`https://open.spotify.com/track/${trackId}?si=secret&utm_source=test`)).toEqual({ trackId, url: `https://open.spotify.com/track/${trackId}` });
  });

  it.each([
    `http://open.spotify.com/track/${trackId}`,
    `https://open.spotify.com.evil.example/track/${trackId}`,
    `https://open.spotify.com/album/${trackId}`,
    'https://open.spotify.com/track/no',
    'not a url',
  ])('rejects unsupported input %s', value => {
    expect(() => normalizeSpotifyTrackUrl(value)).toThrow('INVALID_SPOTIFY_URL');
  });
});

describe('SpotifyOEmbedService', () => {
  it('maps trusted metadata and discards embed HTML', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ provider_name: 'Spotify', type: 'rich', title: 'Test Track', thumbnail_url: 'https://i.scdn.co/image/cover', html: '<iframe src="untrusted"></iframe>' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const service = new SpotifyOEmbedService(request);
    const result = await service.resolve(`https://open.spotify.com/track/${trackId}?si=x`);

    expect(result).toEqual({ provider: 'spotify', id: trackId, title: 'Test Track', artists: [], imageUrl: 'https://i.scdn.co/image/cover', externalUrl: `https://open.spotify.com/track/${trackId}`, uri: `spotify:track:${trackId}` });
    expect(result).not.toHaveProperty('html');
    expect(request.mock.calls[0]?.[0]).toContain('https://open.spotify.com/oembed?url=');
  });

  it.each([
    [{ provider_name: 'Other', title: 'Track' }, 'SPOTIFY_OEMBED_INVALID'],
    [{ provider_name: 'Spotify', title: '' }, 'SPOTIFY_OEMBED_INVALID'],
  ])('rejects untrusted or incomplete metadata', async (body, code) => {
    const service = new SpotifyOEmbedService(async () => new Response(JSON.stringify(body), { status: 200 }));
    await expect(service.resolve(`https://open.spotify.com/track/${trackId}`)).rejects.toThrow(code);
  });

  it('reports non-success responses', async () => {
    const service = new SpotifyOEmbedService(async () => new Response('', { status: 404 }));
    await expect(service.resolve(`https://open.spotify.com/track/${trackId}`)).rejects.toThrow('SPOTIFY_OEMBED_FAILED_404');
  });
});
