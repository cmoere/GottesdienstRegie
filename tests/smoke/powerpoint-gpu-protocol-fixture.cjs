// External process double only. Never used by the application or native capture.
const readline = require('node:readline');
const mode = process.argv[2];
let sessionId, generation, sequence = 0, noticeId = 0;
const leases = new Map(), batch = [];
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');
const hello = {status: 'hello', protocol: 1, parentPid: process.ppid, parentCreated: '133000000000000000', nonce: 'cc'.repeat(16)};
if (mode === 'wrong-parent') hello.parentPid++;
emit(hello);
const input = readline.createInterface({input: process.stdin});
input.on('line', line => {
  const w = line.split(' ');
  if (w[0] === 'start') {
    const guarded=mode==='guarded';
    if (w.length !== (guarded?18:16) || w[1] !== (guarded?'2':'1') || (guarded&&(w[16]!=='456'||w[17]!=='789')) || w[2] !== hello.nonce || w[14] !== String(process.ppid) || w[15] !== hello.parentCreated) process.exit(3);
    sessionId = w[3]; generation = w[4];
    if(mode==='native-error'||mode==='unsafe-native-error'){emit({status:'error',code:mode==='native-error'?'SOURCE_GEOMETRY_CHANGED':'C:/private/path'});return;}
    const ready = {status: 'ready', sessionId, generation, width: 1920, height: 1080, handles: ['9007199254740993', '9007199254740995', '9007199254740997']};
    if (mode === 'bad-handle') ready.handles[0] = '18446744073709551616';
    if (mode === 'same-handles') ready.handles[1] = ready.handles[0];
    if (mode === 'ready-session') ready.sessionId = '00'.repeat(16);
    if (mode === 'fragmented') {
      const bytes = Buffer.from(JSON.stringify(ready) + '\n'); let offset = 0;
      const send = () => {if (offset === bytes.length) return; process.stdout.write(bytes.subarray(offset, offset + 3)); offset += Math.min(3, bytes.length - offset); setImmediate(send);}; send();
    } else emit(ready);
    if (mode === 'notice') emit({status: 'notice', sessionId, generation, noticeId: ++noticeId});
    return;
  }
  if (w[0] === 'stop') { emit({status: 'closed', drained: leases.size === 0}); process.exitCode = 0; input.close(); process.stdin.destroy(); return; }
  if (w[0] === 'notice') return;
  const requestId = Number(w[1]);
  if (mode === 'eof') {process.exit(0); return;}
  if (mode === 'hang' || (mode === 'hang-claim' && w[0] === 'claim') || (mode === 'hang-release' && w[0] === 'release')) return;
  if (mode === 'oversized') {process.stdout.write(' '.repeat(2049) + '\n'); return;}
  if (mode === 'utf8') {process.stdout.write(Buffer.from([0xff, 10])); return;}
  if (mode === 'nul') {process.stdout.write(Buffer.from([0, 10])); return;}
  if (w[0] === 'clock') {
    const value = {status: 'clock', requestId, qpcNow: '12345678901234567', qpcFrequency: '10000000'};
    if (mode === 'batch16') {
      batch.push(JSON.stringify(value).padEnd(2048, ' ') + '\n');
      if (batch.length === 16) process.stdout.write(batch.join(''));
    } else {emit(value); if (mode === 'duplicate-reply') emit(value);}
    if (mode === 'source-lost') emit({status: 'source-lost', code: 'SOURCE_WINDOW_CLOSED'});
    if (mode === 'notice') emit({status: 'notice', sessionId, generation, noticeId: ++noticeId});
    return;
  }
  if (w[0] === 'claim') {
    if (mode === 'empty') {emit({status: 'empty', requestId}); return;}
    if (mode === 'duplicate-key' && sequence) sequence--;
    const key = {sessionId, generation, slotId: sequence % 3, sequence: ++sequence};
    const record = {key, times: {sourceReportedQpc: '12345678901234999', acquiredQpc: '12345678901234567', copyDoneQpc: '12345678901234568', qpcFrequency: '10000000'}, width: 1920, height: 1080, pixelFormat: 'bgra'};
    if (mode === 'generation') key.generation = '00'.repeat(16);
    if (mode === 'dimensions') record.width = 4097;
    if (mode === 'unsafe-sequence') key.sequence = Number.MAX_SAFE_INTEGER + 1;
    if (mode === 'extra-field') record.path = 'not allowed';
    if (mode === 'backwards-copy') record.times.copyDoneQpc = '1';
    leases.set(key.slotId, key); emit({status: 'claimed', requestId, record}); return;
  }
  if (w[0] === 'release') {
    const key = {sessionId: w[2], generation: w[3], slotId: Number(w[4]), sequence: Number(w[5])};
    leases.delete(key.slotId); emit({status: 'released', requestId, key});
  }
});
