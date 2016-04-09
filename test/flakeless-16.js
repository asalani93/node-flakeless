'use strict';

const assert = require('chai').assert;
const Flakeless = require('..').Flakeless;

describe('Flakeless base16 output', function() {
  it('is an object', function() {
    const flakeless = new Flakeless({
      outputType: 'base16'
    });

    assert.equal(typeof flakeless, 'object');
    assert.instanceOf(flakeless, Flakeless);
  });

  it('returns a string', function() {
    const flakeless = new Flakeless({
      outputType: 'base16'
    });

    const id = flakeless.next();

    assert.typeOf(id, 'string');
  });

  it('is 16 characters long', function() {
    const flakeless = new Flakeless({
      outputType: 'base16'
    });

    const id = flakeless.next();

    assert.lengthOf(id, 16);
  });

  it('increases', function() {
    // Define a Flakeless counter that outputs in base10.
    const flakeless = new Flakeless({
      epochStart: Date.now(),
      outputType: 'base16'
    });

    // Generate a bunch of IDs.
    const ids = [];
    for (let i = 0; i < 1000; ++i) {
      ids.push(flakeless.next());
    }

    // Sort the IDs.  If the output of next is increasing, this should be exact
    //   same as the not-yet-sorted array.
    const sortedIds = ids.sort();
    assert.deepEqual(ids, sortedIds);
  });

  it('is monotonic', function() {
    const flakeless = new Flakeless({
      epochStart: Date.now(),
      outputType: 'base16'
    });

    // Generate a bunch of IDs.
    const ids = [];
    for (let i = 0; i < 1000; ++i) {
      ids.push(flakeless.next());
    }

    // Sort the IDs and remove duplicates.  If the output is monotonic, the
    //   length of the two array should be the same.
    const sortedIds = ids.sort().reduce(function(prev, curr) {
      return (curr === prev[0]) ? prev : [curr].concat(prev);
    }, []);
    assert.lengthOf(sortedIds, 1000);
  });

  it('has an encoded timestamp', function() {
    const flakeless = new Flakeless({
      epochStart: Date.now() - 100,
      outputType: 'base16',
      workerID: 0x3ff
    });

    const id = parseInt(flakeless.next(), 16);

    assert.isAtLeast(id >> 22, 100);
  });

  it('has an encoded worker ID', function() {
    const flakeless = new Flakeless({
      epochStart: Date.now(),
      outputType: 'base16',
      workerID: 34
    });

    const id = parseInt(flakeless.next(), 16);

    assert.equal((id & 0x3ff000) >> 12, 34);
  });

  it('has a properly sized workerID', function() {
    const flakeless = new Flakeless({
      epochStart: Date.now(),
      outputType: 'base16',
      workerID: 0xffffffff
    });

    const id = parseInt(flakeless.next(), 16) >> 12;

    assert.equal(id & 0x3ff, 0x3ff);
  });

  it('has an encoded counter', function() {
    const flakeless = new Flakeless({
      epochStart: Date.now(),
      outputType: 'base16',
      workerID: 0x3ff
    });

    const id = parseInt(flakeless.next(), 16);

    assert.oneOf(id & 0xfff, [0, 1]);
  });
});
