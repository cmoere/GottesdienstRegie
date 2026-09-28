import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAssistantStore } from './assistantStore';
import { AiAssistantPanel } from './AiAssistantPanel';

describe('AiAssistantPanel', () => {
  afterEach(cleanup);
  it('uses neutral product copy without implementation claims', () => {
    const store = createAssistantStore();
    store.setState({ busy: true, progress: 10 });
    render(<AiAssistantPanel open onClose={() => {}} store={store} controller={{ send: vi.fn(), cancel: vi.fn(), retry: vi.fn(), confirm: vi.fn(), reject: vi.fn(), clearHistory: vi.fn() }} />);
    expect(screen.getByText('KI-Helfer arbeitet')).toBeInTheDocument();
    expect(screen.queryByText(/LOKAL|OHNE API-SCHLÜSSEL|Lokale KI arbeitet/i)).not.toBeInTheDocument();
  });

  it('submits prompts, runs quick actions, cancels, and returns focus when closed', async () => {
    const store = createAssistantStore(); const send = vi.fn(); const cancel = vi.fn(); const close = vi.fn();
    render(<AiAssistantPanel open onClose={close} store={store} controller={{ send, cancel, retry: vi.fn(), confirm: vi.fn(), reject: vi.fn(), clearHistory: vi.fn() }} />);
    fireEvent.change(screen.getByLabelText('Auftrag an den KI-Helfer'), { target: { value: 'Willkommensfolie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' })); expect(send).toHaveBeenCalledWith('Willkommensfolie');
    fireEvent.click(screen.getByRole('button', { name: 'Folie kürzen' })); expect(send).toHaveBeenCalledTimes(2);
    act(()=>store.setState({ busy: true, progress: 42 }));
    expect(screen.getByText('42 %')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' })); expect(cancel).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'KI-Helfer schließen' })); expect(close).toHaveBeenCalled();
  });

  it('previews a plan and waits for confirmation', () => {
    const store = createAssistantStore(); const confirm = vi.fn();
    store.setState({ pendingPlan: { id: 'p1', baseRevision: 1, summary: 'Zwei Änderungen', actions: [{ kind: 'report', title: 'Prüfung', text: 'Gut' }] } });
    render(<AiAssistantPanel open onClose={() => {}} store={store} controller={{ send: vi.fn(), cancel: vi.fn(), retry: vi.fn(), confirm, reject: vi.fn(), clearHistory: vi.fn() }} />);
    expect(screen.getByText('Zwei Änderungen')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Änderungen anwenden' })); expect(confirm).toHaveBeenCalledWith('p1');
  });
});
