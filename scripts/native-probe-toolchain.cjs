const path = require('node:path');
const {spawn} = require('node:child_process');

function runNativeCommand(exe, args, options) {
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

async function resolveNativeToolchain() {
  if (process.platform !== 'win32' || process.arch !== 'x64') throw Error('NATIVE_BUILD_WINDOWS_X64_REQUIRED');
  const vswhere = path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'Microsoft Visual Studio/Installer/vswhere.exe');
  const found = await runNativeCommand(vswhere, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath']);
  if (found.code !== 0 || !found.stdout.trim()) throw Error('NATIVE_BUILD_TOOLCHAIN_MISSING');
  const dev = path.join(found.stdout.trim(), 'Common7/Tools/VsDevCmd.bat');
  if (/["\r\n]/.test(dev)) throw Error('NATIVE_BUILD_TOOLCHAIN_PATH_INVALID');
  const setup = await runNativeCommand(process.env.ComSpec || 'C:/Windows/System32/cmd.exe', ['/d', '/s', '/c', `"call "${dev}" -arch=x64 -host_arch=x64 >nul && set"`], {windowsVerbatimArguments: true});
  if (setup.code !== 0) throw Error('NATIVE_BUILD_ENVIRONMENT_FAILED');
  // Values can contain credentials. Never persist or log the setup output/environment.
  const env = {...process.env};
  for (const line of setup.stdout.split(/\r?\n/)) {
    const equals = line.indexOf('=');
    if (equals > 0) env[line.slice(0, equals)] = line.slice(equals + 1);
  }
  if (!env.WindowsSdkDir || !env.WindowsSDKVersion) throw Error('NATIVE_BUILD_SDK_MISSING');
  if (!env.VCToolsInstallDir) throw Error('NATIVE_BUILD_COMPILER_MISSING');
  return {compiler: path.join(env.VCToolsInstallDir, 'bin/Hostx64/x64/cl.exe'), env};
}
module.exports = {resolveNativeToolchain, runNativeCommand};
