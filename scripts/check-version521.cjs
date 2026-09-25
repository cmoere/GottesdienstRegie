const assert = require('node:assert/strict');
const fs = require('node:fs');

const pkg = require('../package.json');
const releases = JSON.parse(fs.readFileSync('public/releases.json', 'utf8'));
const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
const builds = releases.versions.flatMap((line) => line.builds);

assert.equal(pkg.version, '0.52.1');
assert.deepEqual(builds.filter((build) => build.current).map((build) => build.version), ['0.52.1']);
for (const version of ['0.49.0', '0.50.0', '0.51.0', '0.52.0', '0.52.1']) {
  assert.ok(builds.some((build) => build.version === version), `missing web release note ${version}`);
}
assert.match(pagesWorkflow, /tags:\s*\n\s*- ['"]v\*['"]/);
console.log('Version 0.52.1 web release-note publishing checks passed.');
