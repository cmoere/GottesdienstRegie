import { describe, expect, it, vi } from 'vitest';
import { createAssistantController } from './assistantController';
import { createAssistantStore } from './assistantStore';

const answer = { message: 'Lokale Antwort' };
const planned = { message: 'Vorschlag', plan: { id: 'p1', baseRevision: 1, summary: 'Text ändern', actions: [{ kind: 'report', title: 'Prüfung', text: 'Okay' }] } };

function setup(response: unknown = answer, mode: 'confirm' | 'direct' = 'confirm') {
  const generate = vi.fn(async () => response);
  const applyPlan = vi.fn(() => ({ ok: true as const, document: {} as never }));
  const store = createAssistantStore();
  const controller = createAssistantController({
    inference: { generate }, store, getContext: () => ({ language: 'de', truncated: false }),
    getProfile: () => 'eco', getExecutionMode: () => mode, getRevision: () => 1, applyPlan,
  });
  return { controller, store, generate, applyPlan };
}

describe('assistantController', () => {
  it('adds a local answer to chat history', async () => {
    const { controller, store } = setup(); await controller.send('Frage');
    expect(store.getState().messages.map(message => message.content)).toEqual(['Frage', 'Lokale Antwort']);
  });

  it('keeps a proposed plan pending in confirmation mode', async () => {
    const { controller, store, applyPlan } = setup(planned); await controller.send('Prüfen');
    expect(store.getState().pendingPlan?.id).toBe('p1'); expect(applyPlan).not.toHaveBeenCalled();
    await controller.confirm('p1'); expect(applyPlan).toHaveBeenCalledOnce();
  });

  it('applies immediately in direct mode and exposes undo for five seconds', async () => {
    const { controller, store, applyPlan } = setup(planned, 'direct'); await controller.send('Ändern');
    expect(applyPlan).toHaveBeenCalledOnce(); expect(store.getState().undoUntil).toBeGreaterThan(Date.now());
  });

  it('cancels, retries, rejects malformed output, and enforces one writer', async () => {
    let release!: (value: unknown) => void;
    const pending = new Promise<unknown>(resolve => { release = resolve; });
    const { controller, store, generate } = setup(); generate.mockReturnValueOnce(pending);
    const first = controller.send('Lang');
    await expect(controller.send('Parallel')).rejects.toThrow(/läuft bereits/);
    controller.cancel(); release(answer); await first;
    await controller.retry(); expect(generate).toHaveBeenCalledTimes(2);
    generate.mockResolvedValueOnce({ bad: true }); await controller.send('Kaputt');
    expect(store.getState().error).toMatch(/sicher interpretiert/);
  });

  it('clears local history on demand', async () => {
    const { controller, store } = setup(); await controller.send('Frage'); controller.clearHistory();
    expect(store.getState().messages).toEqual([]);
  });
});
