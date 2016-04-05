Flakeless
=========

Flakeless is a Javascript library and Node.js native addon for computing small, unique IDs for web applications. This is useful when incrementing primary keys are either not available (ex: in Cassandra or Neo4j) or not feasible at your current scale.

## How it Works

The strategy for generating IDs is identical to how Twitter generates IDs with Snowflake.  Flakeless is an implementation of their algorithm for Node.js.  The primary benefit of Flakeless over the other Javascript implementations is that Flakeless was written as a native addon, so it has the ease of use of any other Javascript library but has the performance of C++.

The way Snowflake (and by proxy, Flakeless) works is by combining the following values:

* The time difference between the current time and the starting epoch in milliseconds. This accounts for the most significant 41 bits.

* A number signifying the computer generating the ID. This is the middle 10 bits, and is entirely arbitrary and is assigned by the user.

* A counter denoting how many other IDs have been generated in this millisecond. This accounts for the least significant 12 bits.

## Installing

Before you install Flakeless, you first need to make sure that `node-gyp` is installed. Because Flakeless is written primarily in C++, it first needs to be compiled.

```bash
npm install -g node-gyp
```

Once `node-gyp` is installed, install Flakeless.

```bash
npm install flakeless
```

## Usage

### Initialization:

```js
const Flakeless = require('flakeless');
const flakeless = new Flakeless({
  epochStart: Date.now(),
  outputType: 'base64',
  workerID: 71
});
```

`epochStart` is a number representing the start of the time period in milliseconds used to generate IDs. IDs will potentially begin repeating approximately 69 years after this date. This defaults to the beginning of the Unix epoch.

`outputType` is a string representing which alphabet to use when returning the ID. The options are `base10` (using characters 0-9), `base16` (using characters 0-9 and A-F), and `base64` (using characters -, 0-9, A-Z, _, and a-z). Regardless of which format is specified, the output will always be a string. This defaults to `base64`.

`workerID` is an arbitrary identifier signifying the computer generating the IDs. This allows multiple computers to generate IDs without every needing to communicate state. The range for this is from 0 to 1023, and it defaults to 0 if not provided.

### Generating an ID:

```js
let id = flakeless.next();
```

`Flakeless#next` takes no arguments, and returns a string containing the next unique ID.

## Performance

is fast


