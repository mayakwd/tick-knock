/**
 * Benchmark runner.
 *
 * Usage (from the repository root):
 *   pnpm bench                                - benchmark current sources and other ECS libraries
 *   pnpm bench --baseline 4.3.0               - also benchmark published tick-knock version
 *   pnpm bench --baseline ../other/lib        - also benchmark another tick-knock build
 *   pnpm bench --baseline ../other/lib --baseline-name old
 *                                             - the same, with a custom name of the build in the report
 *   pnpm bench --libraries none               - benchmark only tick-knock builds
 *   pnpm bench --libraries bitecs,miniplex    - benchmark only specified other libraries
 *   pnpm bench --filter iterate --time 2000   - run only matching scenarios, 2 seconds per scenario
 */
import {execFileSync} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {createLibrary, isOtherLibraryId, LibraryDescriptor, otherLibraries} from './libraries';
import {Report} from './Report';
import {scenarios} from './Scenario';
import {WorkerResult} from './worker';

interface Options {
  baseline?: string;
  baselineName?: string;
  libraries: string;
  filter?: string;
  time: number;
}

const ROOT = path.join(__dirname, '..');
const CURRENT_BUILD = path.join(ROOT, '..', 'lib');

function parseOptions(args: ReadonlyArray<string>): Options {
  const options: Options = {libraries: 'all', time: 1000};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    if (value === undefined) throw new Error(`Option ${args[i]} requires a value`);
    switch (key) {
      case 'baseline':
      case 'libraries':
      case 'filter':
        options[key] = value;
        break;
      case 'baseline-name':
        options.baselineName = value;
        break;
      case 'time':
        options.time = Number(value);
        break;
      default:
        throw new Error(`Unknown option ${args[i]}`);
    }
  }
  return options;
}

/**
 * Resolves tick-knock baseline: either a path to a build, or a version that is installed from npm
 *
 * @param baseline Path to the build or published version
 * @param name Name of the build in the report, by default it's derived from the path or version
 */
function resolveBaseline(baseline: string, name?: string): LibraryDescriptor {
  if (fs.existsSync(baseline)) {
    const buildPath = path.resolve(baseline);
    return {id: 'tick-knock', name: `tick-knock (${name ?? getBuildName(buildPath)})`, path: buildPath};
  }
  const directory = path.join(ROOT, '.baseline', baseline);
  const buildPath = path.join(directory, 'node_modules', 'tick-knock', 'lib');
  if (!fs.existsSync(buildPath)) {
    console.log(`Installing tick-knock@${baseline}...`);
    fs.mkdirSync(directory, {recursive: true});
    // Baseline is installed as a standalone package, outside of the workspace
    execFileSync('pnpm', ['add', '--ignore-workspace', '--dir', directory, `tick-knock@${baseline}`], {stdio: 'ignore'});
  }
  return {id: 'tick-knock', name: name !== undefined ? `tick-knock (${name})` : `tick-knock ${baseline}`, path: buildPath};
}

/**
 * Derives a short name of the build from its path: the name of the build directory,
 * or the name of its parent directory if the build is in the conventional `lib` directory.
 */
function getBuildName(buildPath: string): string {
  const directory = path.basename(buildPath);
  return directory === 'lib' ? path.basename(path.dirname(buildPath)) : directory;
}

function resolveLibraries(options: Options): LibraryDescriptor[] {
  if (!fs.existsSync(path.join(CURRENT_BUILD, 'index.js'))) {
    throw new Error('tick-knock is not built, run "pnpm build" in the repository root');
  }
  const libraries: LibraryDescriptor[] = [{id: 'tick-knock', name: 'tick-knock (current)', path: CURRENT_BUILD}];
  if (options.baseline !== undefined) {
    libraries.push(resolveBaseline(options.baseline, options.baselineName));
  }
  if (options.libraries !== 'none') {
    const ids = options.libraries === 'all' ? Object.keys(otherLibraries) : options.libraries.split(',');
    for (const id of ids) {
      if (!isOtherLibraryId(id)) throw new Error(`Unknown library "${id}", available: ${Object.keys(otherLibraries).join(', ')}`);
      libraries.push({id});
    }
  }
  return libraries;
}

function runWorker(library: LibraryDescriptor, scenarioId: string, time: number): WorkerResult {
  const output = execFileSync(process.execPath, [
    '--expose-gc',
    path.join(__dirname, 'worker.js'),
    JSON.stringify(library),
    scenarioId,
    String(time),
  ], {encoding: 'utf8'});
  return JSON.parse(output);
}

function main(): void {
  const options = parseOptions(process.argv.slice(2));
  const libraries = resolveLibraries(options);
  const filter = options.filter !== undefined ? new RegExp(options.filter) : undefined;
  const selectedScenarios = scenarios.filter((scenario) => filter === undefined || filter.test(scenario.id));
  const columns = libraries.map((descriptor) => {
    const library = createLibrary(descriptor);
    return {title: `${library.name} ${descriptor.id === 'tick-knock' ? '' : library.version}`.trim()};
  });

  const report = new Report(columns);
  console.log(report.header);
  for (const scenario of selectedScenarios) {
    const measurements = libraries.map((library) => runWorker(library, scenario.id, options.time).measurement);
    console.log(report.addRow({scenario, measurements}));
  }
  console.log(report.footer);
}

main();
