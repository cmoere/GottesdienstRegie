const fs = require('node:fs/promises');
const path = require('node:path');
const {resolveNativeToolchain, runNativeCommand: run} = require('../native-probe-toolchain.cjs');
async function buildProbe({root, target}) {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('NATIVE_BUILD_WINDOWS_X64_REQUIRED');
  const targets = {'frame-ring-tests': 'frame-ring-tests.cpp', 'native-reader': 'reader.cpp', 'frame-ring-writer': 'frame-ring-writer-fixture.cpp', 'native-capture': 'capture.cpp', 'owned-window': 'owned-window-fixture.cpp'};
  if (!Object.hasOwn(targets, target)) throw Error('NATIVE_BUILD_UNKNOWN_TARGET');
  root = path.resolve(root);
  const folder = await fs.mkdtemp(path.join(root, 'work/powerpoint-native-probe-'));
  await fs.writeFile(path.join(folder, '.probe-owned'), 'GottesdienstRegie isolated native probe\n');
  const {compiler, env} = await resolveNativeToolchain();
  const source = path.join(root, 'scripts/powerpoint-native-probe');
  const executable = path.join(folder, target + '.exe');
  const built = await run(compiler, ['/nologo', '/std:c++17', '/EHsc', '/O2', '/W4', '/utf-8', '/DUNICODE', '/D_UNICODE', '/D_WIN32_WINNT=0x0A00', '/Fe:' + executable, path.join(source, 'frame-ring.cpp'), path.join(source, targets[target]), '/link', 'advapi32.lib', 'bcrypt.lib', 'user32.lib', 'gdi32.lib', 'd3d11.lib', 'dxgi.lib', 'd3dcompiler.lib', 'windowsapp.lib'], {cwd: folder, env});
  await fs.writeFile(path.join(folder, 'build.log'), built.stdout + built.stderr);
  if (built.code !== 0) throw Error('NATIVE_BUILD_FAILED: ' + built.stdout + built.stderr);
  return {folder, executable};
}
module.exports = {buildProbe};
