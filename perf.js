'use strict';

const Flakeless = require('./index').Flakeless;
const FlakelessJs = require('./js-impl');
const flakelessJs = new FlakelessJs({outputFmt: 'base64'});
const flakeless10 = new Flakeless({outputType: 'base10'});
const flakeless16 = new Flakeless({outputType: 'base16'});
const flakeless64 = new Flakeless({outputType: 'base64'});

const iterations = 10000000;

console.log('Starting reference test...');

const refPerf = perfTest(function() {
  Date.now();
}, iterations);

console.log('Starting FlakelessJs test...');

const script64Perf = perfTest(function() {
  flakelessJs.next();
}, iterations);

console.log('Starting Flakeless10 test...');

const native10Perf = perfTest(function() {
  flakeless10.next();
}, iterations);

console.log('Starting Flakeless10 test...');

const native16Perf = perfTest(function() {
  flakeless16.next();
}, iterations);

console.log('Starting Flakeless64 test...');

const native64Perf = perfTest(function() {
  flakeless64.next();
}, iterations);

console.log('Performance of call to Date.now():', refPerf);
console.log('Performance of FlakelessJs:', script64Perf);
console.log('Performance of Flakeless10:', native10Perf);
console.log('Performance of Flakeless16:', native16Perf);
console.log('Performance of Flakeless64:', native64Perf);
console.log('Performance increase:', script64Perf / native64Perf);

console.log('Example Flakeless10:', flakeless10.next());
console.log('Example Flakeless16:', flakeless16.next());
console.log('Example Flakeless64:', flakeless64.next());

function perfTest(func, iterations) {
  const a = Date.now();
  for (let i = 0; i < iterations; ++i) {
    func();
  }
  const b = Date.now();
  return (b - a) / iterations;
}
