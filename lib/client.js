'use strict';

const io = require('socket.io-client');

/**
 * Represents a client for a Flakeless ID server.
 * @constructor
 * @param {string} url - The URL of the ID server.
 * @param {clientCallback} [cb] - Called when a connection succeeds or fails.
 */
function Client(url, cb) {
  cb = cb || function() {};

  // Because this server is meant to run on the same physical computer as the
  //   application depending on it, we can use a smaller timeout and get
  //   connection errors faster.
  this.socket = io.connect(url, {timeout: 1000});

  this.socket.on('connect', function() {
    // Handles the case where we successfully connect to the ID server.
    cb();
  });
  this.socket.on('connect_error', function() {
    // Handles the case where the provided URL is not valid and it times out.
    cb('Timeout');
  });
  this.socket.on('error', function(err) {
    // Handles the case where the given namespace is not valid.
    cb(err);
  });
}

/**
 * Requests a number of IDs from the ID server.
 * @param {number} [amount=1] - The number of IDs to request.
 * @return {Promise} - Resolves to a list of strings representing IDs.
 */
Client.prototype.next = function(amount) {
  amount = amount || 1;
  return new Promise(resolve => {
    this.socket.emit('request', amount, data => resolve(data));
  });
};

/**
 * Called when the Client either connects to a Server, or something fails.
 * @callback Client~clientCallback
 * @param {?string} err - The error the socket received, if there is one.
 */

module.exports = Client;
