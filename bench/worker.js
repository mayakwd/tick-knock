// Runs a single scenario against a single tick-knock build and prints the result as JSON.
// Every scenario is executed in its own process, so JIT state of one scenario or library never affects another.
'use strict';
const path = require('path');

const [scenarioPath, libPath, timeArg] = process.argv.slice(2);
const time = Number(timeArg);
const tk = require(path.resolve(libPath));
const scenario = require(path.resolve(scenarioPath));

function now() {
  return Number(process.hrtime.bigint()) / 1e6;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function measureSpeed() {
  const state = scenario.setup(tk);
  const reset = scenario.reset ?? (() => undefined);
  // Warm up to let JIT optimize the code
  const warmupEnd = now() + time * 0.3;
  while (now() < warmupEnd) {
    scenario.run(state);
    reset(state);
  }
  const samples = [];
  const end = now() + time;
  while (now() < end || samples.length < 30) {
    const start = now();
    scenario.run(state);
    samples.push(now() - start);
    reset(state);
  }
  const med = median(samples);
  // Median absolute deviation, relative to the median
  const mad = median(samples.map((value) => Math.abs(value - med)));
  return {value: 1000 / med, deviation: mad / med, samples: samples.length};
}

function measureMemory() {
  if (typeof global.gc !== 'function') throw new Error('Run with --expose-gc');
  global.gc();
  const before = process.memoryUsage().heapUsed;
  const state = scenario.setup(tk);
  global.gc();
  const after = process.memoryUsage().heapUsed;
  // Keep state alive until measurement is done
  global.__benchState = state;
  return {value: (after - before) / scenario.count, deviation: 0, samples: 1};
}

let result;
if (scenario.supported && !scenario.supported(tk)) {
  result = {skipped: true};
} else {
  result = scenario.kind === 'memory' ? measureMemory() : measureSpeed();
}
process.stdout.write(JSON.stringify(result));
