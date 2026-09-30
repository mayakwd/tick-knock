/**
 * Entry point of the benchmark image for Bencher Bare Metal.
 * Runs all scenarios of tick-knock, its baseline and other libraries, and prints results in Bencher Metric Format.
 * Settings are fixed here, so the benchmark command passed to the image doesn't need any options.
 *
 * Progress is printed to stderr with the time since the start. Bencher shows stderr only when the benchmark fails,
 * so the benchmark stops itself before the job timeout: then it's visible how far it went.
 *
 * Environment variables:
 *   BENCH_BASELINE - published tick-knock version to compare with, installed when the image is built
 *   BENCH_TIME     - measurement time of every scenario in milliseconds
 *   BENCH_DEADLINE - time in seconds after which the benchmark is stopped with an error
 *   BENCH_FILTER   - regular expression, only scenarios which ids match are run
 *   BENCH_OUTPUT   - file to write results to, stdout is used if it's not set. The image writes results to a file,
 *                    because Bencher Bare Metal doesn't receive large stdout of the benchmark
 */
import {spawn} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const baseline = process.env.BENCH_BASELINE ?? '4.3.0';
const time = process.env.BENCH_TIME ?? '300';
const deadline = Number(process.env.BENCH_DEADLINE ?? '270');
const filter = process.env.BENCH_FILTER;
const outputPath = process.env.BENCH_OUTPUT || undefined;

const start = Date.now();
const elapsed = () => `[${((Date.now() - start) / 1000).toFixed(1)}s]`;

const child = spawn(process.execPath, [
  path.join(__dirname, 'index.js'),
  '--format', 'json',
  '--baseline', baseline,
  '--time', time,
  ...(filter !== undefined ? ['--filter', filter] : []),
], {stdio: ['ignore', 'pipe', 'pipe']});

let output = '';
child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
  output += chunk;
});
child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
  for (const line of chunk.split('\n')) {
    if (line.length > 0) process.stderr.write(`${elapsed()} ${line}\n`);
  }
});

const timer = setTimeout(() => {
  process.stderr.write(`${elapsed()} Deadline of ${deadline}s exceeded\n`);
  child.kill('SIGKILL');
  process.exit(1);
}, deadline * 1000);

// 'close' is emitted after the output of the benchmark has been read completely, unlike 'exit'
child.on('close', (code, signal) => {
  clearTimeout(timer);
  if (code !== 0) {
    process.stderr.write(`${elapsed()} Benchmark failed with ${signal ?? `code ${code}`}\n`);
    process.exit(1);
  }
  process.stderr.write(`${elapsed()} Done\n`);
  if (outputPath !== undefined) {
    fs.writeFileSync(outputPath, output);
  } else {
    process.stdout.write(output);
  }
});
