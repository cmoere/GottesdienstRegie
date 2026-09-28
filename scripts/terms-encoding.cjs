const UTF16_LE_BOM = Buffer.from([0xff, 0xfe]);

function encodeUtf16LeBom(text) {
  return Buffer.concat([UTF16_LE_BOM, Buffer.from(String(text), 'utf16le')]);
}

function decodeUtf16LeBom(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 2 || buffer[0] !== 0xff || buffer[1] !== 0xfe) {
    throw new Error('TERMS_FILE_MUST_BE_UTF16LE_WITH_BOM');
  }
  return buffer.subarray(2).toString('utf16le');
}

module.exports = { encodeUtf16LeBom, decodeUtf16LeBom };
