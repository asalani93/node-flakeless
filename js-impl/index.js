'use strict';

const addZeros = require('./add-zeros');
const inBase = require('./in-base');

const timestampBits = 41;
const sequenceBits = 12;
const machineBits = 10;
const maxTimestamp = Math.pow(2, timestampBits);
const maxSequence = Math.pow(2, sequenceBits);
const maxMachine = Math.pow(2, machineBits);

function Flakeless(opts) {
  opts = opts || {};

  if (opts.loadState) {
    this.loadState = opts.loadState;
    this.saveState = opts.saveState || function() { return true; };
    this.outputFmt = opts.outputFmt || 'base64';
    this.deserialize(opts.loadState());
  } else {
    this.loadState = opts.loadState || function() {};
    this.saveState = opts.saveState || function() { return true; };
    this.outputFmt = opts.outputFmt || 'base64';
    this.machineID = opts.machineID || 0;
    this.epochStart = opts.epochStart || 1;
    this.epochLast = this.epochStart;
    this.counter = 0;
  }
}

Flakeless.prototype.serialize = function() {
  return `${this.machineID}-${this.epochStart}-${this.epochLast}-${this.counter}`;
};

Flakeless.prototype.deserialize = function(str) {
  const regex = /^(\d+)-(\d+)-(\d+)-(\d+)$/;
  const match = regex.match(str);

  if (match) {
    this.machineID = parseInt(match[0], 10);
    this.epochStart = parseInt(match[1], 10);
    this.epochLast = parseInt(match[2], 10);
    this.counter = parseInt(match[3], 10);
  } else {
    throw 'Failed to deserialize Flakeless state';
  }
};

Flakeless.prototype.next = function() {
  // Generate the new timestamp delta, and increment the counter and last timestamp if required.
  const timeDelta = Date.now() - this.epochStart;
  if (timeDelta === this.epochLast) {
    this.counter += 1;
  } else {
    this.counter = 0;
    this.epochLast = timeDelta;
  }

  // Report the new state of the ID generator to the provided callback.
  // this.saveState(this.serialize());

  // If the counter has gone past the maximum size for the sequence, return false.
  // It's a better idea to let the end user decide what to do when the number of unique IDs is exhausted.
  if (this.counter >= maxSequence) {
    return false;
  }

  // Convert everything to binary and concatenate the strings.
  const binTime = addZeros((timeDelta % maxTimestamp).toString(2), timestampBits);
  const binMachine = addZeros((this.machineID % maxMachine).toString(2), machineBits);
  const binCounter = addZeros((this.counter % maxSequence).toString(2), sequenceBits);
  const binaryString = binTime + binMachine + binCounter;

  // Convert the ID from binary to the specified output format, and return it.
  return inBase(binaryString, this.outputFmt);
};

module.exports = Flakeless;
