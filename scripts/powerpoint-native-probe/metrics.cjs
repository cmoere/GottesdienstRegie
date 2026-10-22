function evaluateRun(run) {
  const failures = [];
  const fail = value => {if (!failures.includes(value)) failures.push(value);};
  const rounded = value => Number.isFinite(value) ? Math.round(value * 1e6) / 1e6 : null;
  const p95 = values => values.length ? rounded([...values].sort((a, b) => a - b)[Math.ceil(values.length * .95) - 1]) : null;
  const durationMs = run?.endMs - run?.startMs;
  if (!Number.isFinite(run?.startMs) || !Number.isFinite(run?.endMs) || durationMs < 60000) fail('DURATION');
  if (!Array.isArray(run?.frames) || !Array.isArray(run?.commands) || !Array.isArray(run?.errors)) return {visual: false, transportPass: false, failures: ['INPUT'], metrics: {durationMs: rounded(durationMs)}};
  if (run.errors.length) fail('RUNTIME_ERROR');
  const roleMaps = {}, roles = {};
  for (const role of ['main', 'mirror']) {
    const map = new Map();
    for (const frame of run.frames.filter(frame => frame.role === role)) {
      if (!Number.isFinite(frame.presentedMs) || !Number.isSafeInteger(frame.sequence) || frame.sequence <= 0 || typeof frame.sourceFingerprint !== 'string' || !frame.sourceFingerprint) {fail('FRAME_INPUT'); continue;}
      if (frame.presentedMs < run.startMs || frame.presentedMs > run.endMs || map.has(frame.sequence)) continue;
      map.set(frame.sequence, frame);
    }
    roleMaps[role] = map;
    const ordered = [...map.values()].sort((a, b) => a.presentedMs - b.presentedMs);
    let previous = null;
    const changed = ordered.filter(frame => {if (previous === frame.sourceFingerprint) return false; previous = frame.sourceFingerprint; return true;});
    const boundaries = [run.startMs, ...changed.map(frame => frame.presentedMs), run.endMs];
    const gaps = boundaries.slice(1).map((value, index) => value - boundaries[index]);
    const actualFrameRate = changed.length / (durationMs / 1000);
    const maxGapMs = Math.max(...gaps);
    roles[role] = {frameCount: changed.length, receivedSequences: map.size, actualFrameRate: rounded(actualFrameRate), maxGapMs: rounded(maxGapMs)};
    if (!map.size) fail('MISSING_' + role.toUpperCase());
    if (!Number.isFinite(actualFrameRate) || actualFrameRate < 29.5) fail('CADENCE_' + role.toUpperCase());
    if (!Number.isFinite(maxGapMs) || rounded(maxGapMs) > 150) fail('GAP_' + role.toUpperCase());
  }
  const pairs = [];
  for (const [sequence, main] of roleMaps.main) {const mirror = roleMaps.mirror.get(sequence); if (mirror) pairs.push(Math.abs(main.presentedMs - mirror.presentedMs));}
  const mirrorSkewP95Ms = p95(pairs);
  if (mirrorSkewP95Ms === null || mirrorSkewP95Ms > 150) fail('MIRROR_SKEW');
  const transportPass = failures.length === 0;
  const commandTimes = [];
  for (const command of run.commands) {
    const a = command?.observed?.main, b = command?.observed?.mirror;
    if (!Number.isFinite(command?.startedMs) || !Number.isFinite(a) || !Number.isFinite(b) || a < command.startedMs || b < command.startedMs) {fail('COMMAND_MISSING'); continue;}
    commandTimes.push(Math.max(a, b) - command.startedMs);
  }
  const commandToFrameP95Ms = p95(commandTimes);
  if (run.kind !== 'transport') {
    if (run.kind !== 'powerpoint') fail('SOURCE_KIND');
    if (run.commands.length < 60 || commandTimes.length !== run.commands.length) fail('COMMAND_COUNT');
    if (commandToFrameP95Ms === null || commandToFrameP95Ms > 250) fail('COMMAND_LATENCY');
    if (run.originalUnchanged !== true || run.foreignDocumentUnchanged !== true) fail('DOCUMENT_CHANGED');
  }
  const captureReady = run.kind === 'powerpoint' && failures.every(code => code === 'DOCUMENT_CHANGED');
  return {visual: run.kind === 'powerpoint' && failures.length === 0, captureReady, transportPass, failures,
    metrics: {durationMs: rounded(durationMs), roles, pairedFrames: pairs.length, unmatchedFrames: roleMaps.main.size + roleMaps.mirror.size - pairs.length * 2,
      mirrorSkewP95Ms, commandCount: run.commands.length, commandToFrameP95Ms}};
}
module.exports = {evaluateRun};
