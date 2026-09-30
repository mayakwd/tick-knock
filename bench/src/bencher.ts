/**
 * Entry point of the benchmark image for Bencher Bare Metal.
 * Runs all scenarios of tick-knock, its baseline and other libraries, and prints results in Bencher Metric Format.
 * Settings are fixed here, so the benchmark command passed to the image doesn't need any options.
 *
 * Environment variables:
 *   BENCH_BASELINE - published tick-knock version to compare with, installed when the image is built
 *   BENCH_TIME     - measurement time of every scenario in milliseconds
 */
import {execFileSync} from 'child_process';
import * as path from 'path';

const baseline = process.env.BENCH_BASELINE ?? '4.3.0';
const time = process.env.BENCH_TIME ?? '700';

execFileSync(process.execPath, [
  path.join(__dirname, 'index.js'),
  '--format', 'json',
  '--baseline', baseline,
  '--time', time,
], {stdio: 'inherit'});
