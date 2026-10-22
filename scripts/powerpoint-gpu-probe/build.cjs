const fs = require('node:fs/promises');
const path = require('node:path');
const {resolveNativeToolchain, runNativeCommand} = require('../native-probe-toolchain.cjs');

async function buildGpuProbe({root, target}) {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('NATIVE_BUILD_WINDOWS_X64_REQUIRED');
  const targets = {
    'slot-tests': ['slot-pool.cpp', 'slot-pool-tests.cpp'],
  };
  if (!Object.hasOwn(targets, target)) throw Error('NATIVE_BUILD_UNKNOWN_TARGET');
  root = path.resolve(root);
  const folder = await fs.mkdtemp(path.join(root, 'work/powerpoint-gpu-probe-'));
  await fs.writeFile(path.join(folder, '.probe-owned'), 'GottesdienstRegie isolated GPU probe\n');
  const {compiler, env} = await resolveNativeToolchain();
  const executable = path.join(folder, target + '.exe');
  const source = path.join(root, 'scripts/powerpoint-gpu-probe');
  const result = await runNativeCommand(compiler, ['/nologo', '/std:c++17', '/EHsc', '/O2', '/W4', '/utf-8', '/DUNICODE', '/D_UNICODE', '/D_WIN32_WINNT=0x0A00', '/Fe:' + executable, ...targets[target].map(file => path.join(source, file))], {cwd: folder, env});
  await fs.writeFile(path.join(folder, 'build.log'), result.stdout + result.stderr);
  if (result.code !== 0) throw Error('NATIVE_BUILD_FAILED: ' + result.stdout + result.stderr);
  return {folder, executable};
}
module.exports = {buildGpuProbe};
