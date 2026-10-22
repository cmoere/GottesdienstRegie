function assessClockSamples({startSamples, endSamples, frameTimes}) {
  const diagnostics = ['SOURCE_CLOCK_UNVERIFIED'];
  const uint = v => typeof v === 'string' && /^[1-9][0-9]{0,19}$/.test(v) && BigInt(v) <= 18446744073709551615n;
  const all = [...startSamples, ...endSamples], frequency = all[0]?.qpcFrequency;
  const invalid = startSamples.length !== 3 || endSamples.length !== 3 || !uint(frequency)
    || all.some(s => !Number.isFinite(s.beforeMs) || !Number.isFinite(s.afterMs) || s.afterMs < s.beforeMs || !uint(s.qpcNow) || s.qpcFrequency !== frequency);
  if (invalid) return {mapping: null, uncertaintyMs: null, sourceLatencyAvailable: false, diagnostics: [...diagnostics, 'CLOCK_SAMPLES_INVALID']};
  const qpcMs = value => Number(BigInt(value) / BigInt(frequency)) * 1000 + Number(BigInt(value) % BigInt(frequency)) / Number(frequency) * 1000;
  const best = items => [...items].sort((a, b) => (a.afterMs - a.beforeMs) - (b.afterMs - b.beforeMs))[0];
  const start = best(startSamples), end = best(endSamples);
  const offset = sample => (sample.beforeMs + sample.afterMs) / 2 - qpcMs(sample.qpcNow);
  const uncertaintyMs = Math.max(start.afterMs - start.beforeMs, end.afterMs - end.beforeMs) / 2;
  const driftMs = offset(end) - offset(start);
  if (Math.abs(driftMs) > 2 + 2 * uncertaintyMs) diagnostics.push('CLOCK_DRIFT');
  let previous = 0n;
  for (const t of frameTimes) {
    if (t.qpcFrequency !== frequency || !uint(t.acquiredQpc) || !uint(t.copyDoneQpc) || BigInt(t.copyDoneQpc) < BigInt(t.acquiredQpc) || BigInt(t.copyDoneQpc) < previous
        || (t.sourceReportedQpc !== null && !uint(t.sourceReportedQpc))) {diagnostics.push('FRAME_CLOCK_INVALID'); break;}
    previous = BigInt(t.copyDoneQpc);
    if (t.sourceReportedQpc !== null && BigInt(t.sourceReportedQpc) > BigInt(t.copyDoneQpc) && !diagnostics.includes('SOURCE_REPORTED_IN_FUTURE')) diagnostics.push('SOURCE_REPORTED_IN_FUTURE');
  }
  return {mapping: {qpcFrequency: frequency, offsetMs: offset(start), driftMs}, uncertaintyMs, sourceLatencyAvailable: false, diagnostics};
}
module.exports = {assessClockSamples};
