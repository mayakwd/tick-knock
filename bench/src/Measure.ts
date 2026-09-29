import {Benchmark} from './Scenario';

/**
 * Result of a scenario measurement
 */
export interface Measurement {
  /**
   * Operations per second for speed scenarios, bytes per entity for memory scenarios
   */
  readonly value: number;
  /**
   * Median absolute deviation relative to the median
   */
  readonly deviation: number;
  /**
   * Amount of measured samples
   */
  readonly samples: number;
}

const MIN_SAMPLES = 30;
const WARMUP_SHARE = 0.3;

/**
 * Measures speed of the benchmark in operations per second.
 * Benchmark is warmed up first, to let JIT optimize the code, then every run is measured separately.
 * The result is the median, so it's not affected by occasional garbage collection pauses.
 *
 * @param benchmark Benchmark to measure
 * @param time Measurement time in milliseconds, warmup takes additional 30% of the time
 */
export async function measureSpeed(benchmark: Benchmark, time: number): Promise<Measurement> {
  const warmupEnd = now() + time * WARMUP_SHARE;
  while (now() < warmupEnd) {
    await runOnce(benchmark);
  }

  const samples: number[] = [];
  const end = now() + time;
  while (now() < end || samples.length < MIN_SAMPLES) {
    samples.push(await runOnce(benchmark));
  }

  const medianTime = median(samples);
  const deviation = median(samples.map((value) => Math.abs(value - medianTime))) / medianTime;
  return {value: 1000 / medianTime, deviation, samples: samples.length};
}

/**
 * Measures heap growth caused by a single run of the benchmark.
 * Requires node to be started with `--expose-gc` flag.
 *
 * @param benchmark Benchmark to measure
 * @param count Amount of entities created by the benchmark
 */
export async function measureMemory(benchmark: Benchmark, count: number): Promise<Measurement> {
  if (global.gc === undefined) {
    throw new Error('Memory measurement requires --expose-gc flag');
  }
  global.gc();
  const before = process.memoryUsage().heapUsed;
  await benchmark.run();
  global.gc();
  const after = process.memoryUsage().heapUsed;
  return {value: (after - before) / count, deviation: 0, samples: 1};
}

/**
 * Runs the benchmark once and resets it
 * @returns Time of the run in milliseconds
 */
async function runOnce(benchmark: Benchmark): Promise<number> {
  const start = now();
  const result = benchmark.run();
  // Awaiting only asynchronous benchmarks, so synchronous ones are not affected by promise overhead
  if (result !== undefined) await result;
  const time = now() - start;
  if (benchmark.reset !== undefined) await benchmark.reset();
  return time;
}

function now(): number {
  return Number(process.hrtime.bigint()) / 1e6;
}

function median(values: ReadonlyArray<number>): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
