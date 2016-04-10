'use strict';

const assert = require('chai').assert;

const flakeless = require('..');
const Flakeless = flakeless.Flakeless;
const Client = flakeless.Client;
const Server = flakeless.Server;

describe('Client-server communication', function() {
  // Create a server with only one generator.
  const server1 = new Server(6000, function() {
    server1.addGenerator('/a', new Flakeless({
      outputType: 'base64'
    }));
  });

  // Create a server that has three generators, each with unique worker IDs.
  const server2 = new Server(6001, function() {
    server2.addGenerator('/a', new Flakeless({
      outputType: 'base16',
      workerID: 0
    }));
    server2.addGenerator('/b', new Flakeless({
      outputType: 'base16',
      workerID: 1
    }));
    server2.addGenerator('/c', new Flakeless({
      outputType: 'base16',
      workerID: 2
    }));
  });

  it('generates an ID', function() {
    // Connect to the server and request a single ID.
    const client = new Client('http://localhost:6000/a');
    return client.next().then(function(ids) {
      // The response should be an array.
      assert.typeOf(ids, 'array');
      // The array should have exactly the amount of requested IDs in it.
      assert.lengthOf(ids, 1);
      // Each element of the response array should be a string.
      assert.typeOf(ids[0], 'string');
      // Each element of the response aray should have 11 chars.
      assert.lengthOf(ids[0], 11);
    });
  });

  it('generates multiple IDs', function() {
    // Connect to the server and request 1000 IDs.
    const client = new Client('http://localhost:6000/a');
    return client.next(1000).then(function(ids) {
      // The response should be an array.
      assert.typeOf(ids, 'array');
      // The array should have exactly the amount of requested IDs in it.
      assert.lengthOf(ids, 1000);
      // Each element of the response array should be a string.
      assert.typeOf(ids[0], 'string');
      // Each element of the response aray should have 11 chars.
      assert.lengthOf(ids[0], 11);
    });
  });

  it('knows it connected', function(done) {
    // Connect to the server and the callback shouldn't return an error.
    const client = new Client('http://localhost:6000/a', function(err) {
      try {
        assert.isUndefined(err);
        done();
      } catch (err) {
        done(new Error(err));
      }
    });
    assert.instanceOf(client, Client);
  });

  it('throws an error when it fails to connect', function(done) {
    // This test relies on being hitting a timeout at 1000 ms.
    this.slow(1200);
    const client = new Client('not an actual URL', function(err) {
      try {
        assert.isDefined(err);
        assert.equal(err, 'Timeout');
        done();
      } catch (err) {
        done(new Error(err));
      }
    });
    assert.instanceOf(client, Client);
  });

  it('throws an error on an invalid namespace', function(done) {
    // Connect to an invalid namespace and expect an error in err.
    const client = new Client('http://localhost:6001/d', function(err) {
      try {
        assert.isDefined(err);
        assert.equal(err, 'Invalid namespace');
        done();
      } catch (err) {
        done(new Error(err));
      }
    });
    assert.instanceOf(client, Client);
  });

  it('connects to the right generator', function() {
    // Create three different clients that connect to different generators.
    const client1 = new Client('http://localhost:6001/a');
    const client2 = new Client('http://localhost:6001/b');
    const client3 = new Client('http://localhost:6001/c');

    // Generate an ID on each and check for the correct worker ID.
    return client1.next().then(function(ids) {
      assert.equal(ids[0][12], '0');
      return client2.next();
    }).then(function(ids) {
      assert.equal(ids[0][12], '1');
      return client3.next();
    }).then(function(ids) {
      assert.equal(ids[0][12], '2');
    });
  });
});
