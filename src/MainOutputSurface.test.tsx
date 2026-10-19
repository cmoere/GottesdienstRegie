import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MainLivePreview } from './MainLivePreview';
import {usePreferences} from './preferences';
const initial=usePreferences.getState();
afterEach(()=>usePreferences.setState(initial,true));

describe('MainLivePreview', () => {
  it('shows the current MAIN slide without a red LIVE badge', () => {
    usePreferences.setState({language:'de',germanRegion:null});
    const { container } = render(<MainLivePreview title="Lied · Strophe 1"><div>Folienbild</div></MainLivePreview>);

    expect(screen.getByText('LIVE AUF MAIN')).toBeInTheDocument();
    expect(screen.getByText('Lied · Strophe 1')).toBeInTheDocument();
    expect(screen.queryByText(/^LIVE$/)).not.toBeInTheDocument();
    expect(container.querySelector('.preview-live-badge')).toBeNull();
  });
});
