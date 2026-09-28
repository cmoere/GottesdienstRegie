import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpotifyBrowser } from './SpotifyBrowser';
import type { SpotifyTrackReference } from './types';

const track: SpotifyTrackReference = { provider: 'spotify', id: '4uLU6hMCjMI75M1A2tKUQC', title: 'Test Track', artists: [], imageUrl: 'https://i.scdn.co/image/cover', externalUrl: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', uri: 'spotify:track:4uLU6hMCjMI75M1A2tKUQC' };

describe('SpotifyBrowser', () => {
  const resolve = vi.fn(); const open = vi.fn();
  beforeEach(() => { localStorage.clear(); resolve.mockReset(); open.mockReset(); Object.assign(window, { desktop: { spotify: { resolve, open } } }); });
  afterEach(cleanup);

  it('resolves, previews, saves, and opens a Spotify track link', async () => {
    resolve.mockResolvedValue(track); open.mockResolvedValue(true);
    render(<SpotifyBrowser/>);
    expect(screen.queryByText(/Konto verbinden|Titel, Interpret oder Album/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Spotify-Titellink'), { target: { value: `${track.externalUrl}?si=x` } });
    fireEvent.keyDown(screen.getByLabelText('Spotify-Titellink'), { key: 'Enter' });
    expect(await screen.findByText('Test Track')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Verknüpfung speichern' }));
    fireEvent.click(screen.getByRole('button', { name: 'In Spotify öffnen' }));
    expect(JSON.parse(localStorage.getItem('gottesdienstregie.spotify.references') ?? '[]')).toEqual([track]);
    expect(open).toHaveBeenCalledWith(track.externalUrl);
  });

  it('shows a retry action after resolution fails', async () => {
    resolve.mockRejectedValue(new Error('SPOTIFY_OEMBED_FAILED_404'));
    render(<SpotifyBrowser/>);
    fireEvent.change(screen.getByLabelText('Spotify-Titellink'), { target: { value: track.externalUrl } });
    fireEvent.click(screen.getByRole('button', { name: 'Titel laden' }));
    expect(await screen.findByText('Spotify-Titel konnte nicht geladen werden.')).toBeInTheDocument();
    resolve.mockResolvedValue(track);
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    await waitFor(() => expect(screen.getByText('Test Track')).toBeInTheDocument());
  });
});
