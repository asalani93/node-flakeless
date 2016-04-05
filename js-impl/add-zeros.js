'use strict';

function addZeros(str, size) {
  // Hehe one line leftpad.
  return ('0').repeat(size - str.length) + str;
}

module.exports = addZeros;
