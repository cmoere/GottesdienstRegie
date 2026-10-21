const fs = require('node:fs/promises');
const path = require('node:path');
const {spawn} = require('node:child_process');

function run(exe, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, {windowsHide: true, ...options, stdio: ['ignore', 'pipe', 'pipe']});
    let stdout = '', stderr = '';
    const timer = setTimeout(() => {child.kill(); reject(Error('NATIVE_BUILD_TIMEOUT'));}, 120000);
    child.stdout.on('data', chunk => stdout += chunk);
    child.stderr.on('data', chunk => stderr += chunk);
    child.once('error', error => {clearTimeout(timer); reject(error);});
    child.once('close', code => {clearTimeout(timer); resolve({code, stdout, stderr});});
  });
}
async function buildProbe({root, target}) {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('NATIVE_BUILD_WINDOWS_X64_REQUIRED');
  const targets = {'frame-ring-tests': 'frame-ring-tests.cpp', 'native-reader': 'reader.cpp', 'frame-ring-writer': 'frame-ring-writer-fixture.cpp', 'native-capture': 'capture.cpp', 'owned-window': 'owned-window-fixture.cpp'};
  if (!Object.hasOwn(targets, target)) throw Error('NATIVE_BUILD_UNKNOWN_TARGET');
  root = path.resolve(root);
  const folder = await fs.mkdtemp(path.join(root, 'work/powerpoint-native-probe-'));
  await fs.writeFile(path.join(folder, '.probe-owned'), 'GottesdienstRegie isolated native probe\n');
  const vswhere = path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'Microsoft Visual Studio/Installer/vswhere.exe');
  const found = await run(vswhere, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath']);
  if (found.code !== 0 || !found.stdout.trim()) throw Error('NATIVE_BUILD_TOOLCHAIN_MISSING');
  const dev = path.join(found.stdout.trim(), 'Common7/Tools/VsDevCmd.bat');
  if (/["\r\n]/.test(dev)) throw Error('NATIVE_BUILD_TOOLCHAIN_PATH_INVALID');
  const setup = await run(process.env.ComSpec || 'C:/Windows/System32/cmd.exe', ['/d', '/s', '/c', `"call "${dev}" -arch=x64 -host_arch=x64 >nul && set"`], {windowsVerbatimArguments: true});
  if (setup.code !== 0) throw Error('NATIVE_BUILD_ENVIRONMENT_FAILED');
  // Environment values may contain credentials: keep them in memory, never log them.
  const env = {...process.env};
  for (const line of setup.stdout.split(/\r?\n/)) {const equals = line.indexOf('='); if (equals > 0) env[line.slice(0, equals)] = line.slice(equals + 1);}
  if (!env.WindowsSdkDir || !env.WindowsSDKVersion) throw Error('NATIVE_BUILD_SDK_MISSING');
  const source = path.join(root, 'scripts/powerpoint-native-probe');
  const executable = path.join(folder, target + '.exe');
  if (!env.VCToolsInstallDir) throw Error('NATIVE_BUILD_COMPILER_MISSING');
  const compiler = path.join(env.VCToolsInstallDir, 'bin/Hostx64/x64/cl.exe');
  const built = await run(compiler, ['/nologo', '/std:c++17', '/EHsc', '/O2', '/W4', '/utf-8', '/DUNICODE', '/D_UNICODE', '/D_WIN32_WINNT=0x0A00', '/Fe:' + executable, path.join(source, 'frame-ring.cpp'), path.join(source, targets[target]), '/link', 'advapi32.lib', 'bcrypt.lib', 'user32.lib', 'gdi32.lib', 'd3d11.lib', 'dxgi.lib', 'd3dcompiler.lib', 'windowsapp.lib'], {cwd: folder, env});
  await fs.writeFile(path.join(folder, 'build.log'), built.stdout + built.stderr);
  if (built.code !== 0) throw Error('NATIVE_BUILD_FAILED: ' + built.stdout + built.stderr);
  return {folder, executable};
}
module.exports = {buildProbe};
