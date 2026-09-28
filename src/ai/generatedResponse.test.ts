import { describe, expect, it } from 'vitest';
import { parseAiAssistantResponse } from './actionSchema';
import { normalizeGeneratedResponse } from './generatedResponse';

const validate = (candidate: unknown) => {
  try { parseAiAssistantResponse(candidate); return true; } catch { return false; }
};

describe('normalizeGeneratedResponse', () => {
  it('accepts direct objects and generated-text envelopes', () => {
    expect(normalizeGeneratedResponse({ message: 'Direkt' }, validate)).toEqual({ message: 'Direkt' });
    expect(normalizeGeneratedResponse([{ generated_text: '{"message":"Hülle"}' }], validate)).toEqual({ message: 'Hülle' });
  });

  it('extracts schema-valid JSON after echoed instructions with braces', () => {
    const raw = 'DU\nAntworte als JSON nach {message, plan}.\n```json\n{"message":"Nur diese Antwort"}\n```';
    expect(normalizeGeneratedResponse(raw, validate)).toEqual({ message: 'Nur diese Antwort' });
  });

  it('selects the only schema-valid object from multiple candidates', () => {
    const raw = '{"debug":"intern"}\nErgebnis: {"message":"Freigegeben"}';
    expect(normalizeGeneratedResponse(raw, validate)).toEqual({ message: 'Freigegeben' });
  });

  it('rejects output without a schema-valid object', () => {
    expect(() => normalizeGeneratedResponse('Systemprompt ohne Antwort', validate)).toThrow('AI_RESPONSE_INVALID');
  });
});
