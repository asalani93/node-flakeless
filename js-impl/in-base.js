'use strict';

const addZeros = require('./add-zeros');

const alph64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const alph16 = '0123456789ABCDEF';
const alph10 = '0123456789';

function inBase(binstr, out) {
  switch (out) {
  case 'base2':
    return binstr;
  case 'base16':
    return inBase16(binstr);
  case 'base64':
    return inBase64(binstr);
  default:
    throw `Unknown base provided: "${out}"`;
  }
}

// Converts the binary string binstr to a hexadecimal string.
function inBase16(binstr) {
  const size = 4;
  const len = binstr.length;
  const digits = Math.ceil(len / size);
  const padstr = addZeros(binstr, digits * size);
  let outstr = '';
  for (let i = 0; i < digits; ++i) {
    const bitSeq = padstr.substr(i * size, size);
    outstr += alph16[parseInt(bitSeq, 2)];
  }
  return outstr;
}

// Converts a binary string into a base 64 string.
function inBase64(binstr) {
  const size = 6;
  const len = binstr.length;
  const digits = Math.ceil(len / size);
  const padstr = addZeros(binstr, digits * size);
  let outstr = '';
  for (let i = 0; i < digits; ++i) {
    const bitSeq = padstr.substr(i * size, size);
    outstr += alph64[parseInt(bitSeq, 2)];
  }
  return outstr;
}

module.exports = inBase;
