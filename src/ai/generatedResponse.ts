function unwrap(raw: unknown): unknown {
  if (Array.isArray(raw) && raw.length === 1 && raw[0] && typeof raw[0] === 'object' && 'generated_text' in raw[0]) {
    return (raw[0] as { generated_text: unknown }).generated_text;
  }
  return raw;
}

function objectCandidates(source: string): unknown[] {
  const candidates: unknown[] = [];
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '{') continue;
    let depth = 0; let quoted = false; let escaped = false;
    for (let end = start; end < source.length; end += 1) {
      const character = source[end];
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') quoted = false;
        continue;
      }
      if (character === '"') quoted = true;
      else if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try { candidates.push(JSON.parse(source.slice(start, end + 1))); } catch { /* try the next opening brace */ }
          break;
        }
      }
    }
  }
  return candidates;
}

export function normalizeGeneratedResponse(raw: unknown, validate: (candidate: unknown) => boolean): unknown {
  const value = unwrap(raw);
  const candidates = typeof value === 'string' ? objectCandidates(value) : [value];
  const accepted = candidates.find(candidate => validate(candidate));
  if (accepted === undefined) throw new Error('AI_RESPONSE_INVALID');
  return accepted;
}
