import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferences, defaultAiAssistantPreferences } from '../preferences';
import { AiSettings } from './AiSettings';

describe('AiSettings', () => {
  beforeEach(() => usePreferences.setState({ aiAssistant: { ...defaultAiAssistantPreferences } }));
  afterEach(cleanup);
  it('uses automatic selection by default and persists model, mode, and permissions', () => {
    render(<AiSettings supported manager={undefined}/>);
    expect(screen.getByLabelText('Modellwahl')).toHaveValue('auto');
    fireEvent.change(screen.getByLabelText('Modellwahl'), { target: { value: 'eco' } });
    fireEvent.click(screen.getByLabelText('Direkt anwenden'));
    fireEvent.click(screen.getByLabelText('Medienvorschläge zulassen'));
    expect(usePreferences.getState().aiAssistant).toMatchObject({ modelPreference: 'eco', executionMode: 'direct', allowMediaSuggestions: false });
  });

  it('shows installed model details and confirms removal and history deletion', async () => {
    const remove = vi.fn(); const clearHistory = vi.fn();
    render(<AiSettings supported manager={{ status: async () => ({ state: 'ready', profile: 'balanced', version: 1, sizeBytes: 123456 }), prepare: vi.fn(), remove }} clearHistory={clearHistory}/>);
    expect(await screen.findByText(/Version 1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lokales Modell entfernen' })); fireEvent.click(screen.getByRole('button', { name: 'Entfernen bestätigen' })); expect(remove).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Lokalen KI-Verlauf löschen' })); fireEvent.click(screen.getByRole('button', { name: 'Verlauf löschen bestätigen' })); expect(clearHistory).toHaveBeenCalled();
  });

  it('recommends desktop when local AI is unavailable', () => {
    render(<AiSettings supported={false} manager={undefined}/>); expect(screen.getByText(/Desktop-App/)).toBeInTheDocument();
  });
});
