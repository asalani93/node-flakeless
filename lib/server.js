'use strict';

const http = require('http');
const socketIO = require('socket.io');

/**
 * Represents a Flakeless ID server with attached ID generators.
 * @constructor
 * @param {number} port - The port to spin up the server on.
 * @param {serverCallback} [cb] - A callback that runs when the server loads.
 */
function Server(port, cb) {
  cb = cb || function() {};

  this.app = http.createServer();
  this.io = socketIO(this.app);
  this.app.listen(port, cb);
}

/**
 * Creates a namespace in the server for the given ID generator.
 * @param {string} name - The namespace to add the generator on.
 * @param {Flakeless} generator - The ID generator to use.
 */
Server.prototype.addGenerator = function(name, generator) {
  this.io.of(name).on('connection', socket => {
    socket.on('request', (amount, fn) => {
      const responseArr = [];
      for (let i = 0; i < amount; ++i) {
        responseArr.push(generator.next());
      }
      fn(responseArr);
    });
  });
};

/**
* Called by Server after it has created a server and begins listening.
 * @callback Server~serverCallback
 */

module.exports = Server;
