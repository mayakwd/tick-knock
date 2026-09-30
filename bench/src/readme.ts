/**
 * Updates the comparison table in README of the repository with results measured by Bencher.
 * The table is placed between `<!-- benchmarks:start -->` and `<!-- benchmarks:end -->` comments,
 * and is also printed to stdout, so CI can show it in the summary of the run.
 *
 * Results are either in Bencher Metric Format, printed by `index.ts --format json`,
 * or a report printed by `bencher run --format json`.
 *
 * Usage: node dist/readme.js <results.json> [README.md]
 */
import * as fs from 'fs';
import * as path from 'path';
import {BencherMetricFormat, MEMORY, THROUGHPUT} from './BencherMetricFormat';
import {otherLibraries} from './libraries';
import {Measurement} from './Measure';
import {Report} from './Report';
import {scenarios} from './Scenario';

/**
 * Hardware of the Bencher bare metal runner, the `intel-v1` spec
 */
const RUNNER = 'Intel, 4 cores';

const START = '<!-- benchmarks:start -->';
const END = '<!-- benchmarks:end -->';

/**
 * Part of the report of `bencher run --format json`, that contains results
 */
interface BencherRunReport {
  end_time?: string;
  results: Array<Array<{
    benchmark: { name: string };
    measures: Array<{
      measure: { slug: string };
      metric?: { value: number; lower_value?: number; upper_value?: number };
      metrics?: Array<{ value: number }>;
    }>;
  }>>;
}

interface Column {
  readonly name: string;
  readonly title: string;
}

function readResults(filePath: string): { results: BencherMetricFormat; date?: string } {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(json.results)) return {results: json};
  const report = json as BencherRunReport;
  const results: BencherMetricFormat = {};
  for (const result of report.results.flat()) {
    for (const {measure, metric, metrics} of result.measures) {
      const value = metric ?? metrics?.[0];
      if (value === undefined) continue;
      results[result.benchmark.name] = {...results[result.benchmark.name], [measure.slug]: value};
    }
  }
  return {results, date: report.end_time?.slice(0, 10)};
}

/**
 * Columns in the order of the benchmark report: current tick-knock, its baseline, then other libraries
 */
function getColumns(results: BencherMetricFormat): Column[] {
  const names = new Set(Object.keys(results).map((name) => name.slice(0, name.lastIndexOf(': '))));
  const columns: Column[] = [];
  if (names.has('tick-knock')) columns.push({name: 'tick-knock', title: 'tick-knock (current)'});
  for (const name of names) {
    if (name.startsWith('tick-knock@')) columns.push({name, title: name.replace('@', ' ')});
  }
  for (const create of Object.values(otherLibraries)) {
    const library = create();
    if (names.has(library.name)) columns.push({name: library.name, title: `${library.name} ${library.version}`});
  }
  return columns;
}

function toMeasurement(results: BencherMetricFormat, name: string): Measurement | undefined {
  const metric = results[name]?.[THROUGHPUT] ?? results[name]?.[MEMORY];
  if (metric === undefined) return undefined;
  const deviation = metric.upper_value !== undefined ? (metric.upper_value - metric.value) / metric.value : 0;
  return {value: metric.value, deviation, samples: 0};
}

/**
 * Gets the major version of Node.js the benchmark image runs on, from the last stage of its Dockerfile.
 * Results are measured in the image, not on the machine that generates the table.
 */
function getBenchmarkNodeVersion(): string {
  const dockerfile = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
  const versions = Array.from(dockerfile.matchAll(/^FROM node:(\d+)/gm), (match) => match[1]);
  if (versions.length === 0) throw new Error('Node.js version is not found in the Dockerfile of the benchmark');
  return versions[versions.length - 1];
}

function main(): void {
  const [resultsPath, readmePath] = process.argv.slice(2);
  if (resultsPath === undefined) throw new Error('Usage: node dist/readme.js <results.json> [README.md]');
  const {results, date} = readResults(resultsPath);
  const columns = getColumns(results);
  const environment = `Measured on [Bencher](https://bencher.dev/perf/tick-knock) bare metal runner (${RUNNER}), ` +
    `Node ${getBenchmarkNodeVersion()}${date !== undefined ? `, ${date}` : ''}.`;
  const report = new Report(columns, environment);
  const lines = [report.header];
  for (const scenario of scenarios) {
    const measurements = columns.map((column) => toMeasurement(results, `${column.name}: ${scenario.id}`));
    if (measurements.some((measurement) => measurement !== undefined)) lines.push(report.addRow({scenario, measurements}));
  }
  const table = lines.join('\n');
  console.log(table);

  if (readmePath === undefined) return;
  const readme = fs.readFileSync(readmePath, 'utf8');
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start) throw new Error(`${readmePath} has no ${START} and ${END} comments`);
  fs.writeFileSync(readmePath, `${readme.slice(0, start + START.length)}\n\n${table}\n\n${readme.slice(end)}`);
}

main();
