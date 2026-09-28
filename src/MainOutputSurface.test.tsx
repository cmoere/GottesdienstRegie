import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainLivePreview } from './MainLivePreview';

describe('MainLivePreview', () => {
  it('shows the current MAIN slide without a red LIVE badge', () => {
    const { container } = render(<MainLivePreview title="Lied · Strophe 1"><div>Folienbild</div></MainLivePreview>);

    expect(screen.getByText('LIVE AUF MAIN')).toBeInTheDocument();
    expect(screen.getByText('Lied · Strophe 1')).toBeInTheDocument();
    expect(screen.queryByText(/^LIVE$/)).not.toBeInTheDocument();
    expect(container.querySelector('.preview-live-badge')).toBeNull();
  });
});
