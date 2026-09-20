const assert=require('node:assert/strict'),fs=require('node:fs');
const icon=fs.readFileSync('src/flags/FlagIcon.tsx','utf8'),css=fs.readFileSync('src/version42.css','utf8'),picker=fs.readFileSync('src/LanguagePicker.tsx','utf8');
assert.equal(icon.includes('className="language-flag"'),false,'FlagIcon must not reuse the login language-flag class');
assert.ok(icon.includes('translation-language-flag'));
assert.match(css,/\.translation-language-flag\{[^}]*width:24px;[^}]*height:16px/);
assert.match(css,/\.language-picker-popover button\{[^}]*grid-template-columns:28px minmax\(0,1fr\) auto/);
assert.ok(picker.includes('<FlagIcon'));
console.log('Version 0.43.1 language picker layout checks passed.');
