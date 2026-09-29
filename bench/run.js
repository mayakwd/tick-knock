// tick-knock benchmark runner.
//
// Usage:
//   yarn bench                               - benchmark current build (lib)
//   yarn bench --baseline 4.3.0              - compare with published version from npm
//   yarn bench --baseline ../other/lib       - compare with another build
//   yarn bench --filter iterate --time 2000  - run only matching scenarios, 2s per scenario
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

function parseArgs(argv) {
  const args = {target: path.join(__dirname, '..', 'lib'), baseline: undefined, filter: undefined, time: 1000};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in args)) throw new Error(`Unknown option ${argv[i]}`);
    args[key] = key === 'time' ? Number(argv[i + 1]) : argv[i + 1];
  }
  return args;
}

function resolveBuild(spec) {
  if (fs.existsSync(spec)) {
    const resolved = path.resolve(spec);
    const name = resolved === path.resolve(__dirname, '..', 'lib') ? 'current' : path.relative(process.cwd(), resolved);
    return {name, path: resolved};
  }
  // Treat as a published version
  const dir = path.join(__dirname, '.baseline', spec);
  const pkg = path.join(dir, 'node_modules', 'tick-knock');
  if (!fs.existsSync(pkg)) {
    fs.mkdirSync(dir, {recursive: true});
    console.log(`Installing tick-knock@${spec}...`);
    execFileSync('npm', ['install', '--no-save', '--no-package-lock', '--prefix', dir, `tick-knock@${spec}`], {stdio: 'ignore'});
  }
  return {name: `tick-knock@${spec}`, path: pkg};
}

function runScenario(file, build, time) {
  const output = execFileSync(process.execPath, ['--expose-gc', path.join(__dirname, 'worker.js'), file, build.path, String(time)], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  return JSON.parse(output);
}

function format(result, scenario) {
  if (result.skipped) return 'n/a';
  if (scenario.kind === 'memory') return `${Math.round(result.value)} B`;
  const value = result.value >= 100 ? Math.round(result.value).toLocaleString('en-US') : result.value.toFixed(1);
  return `${value} ±${(result.deviation * 100).toFixed(1)}%`;
}

function ratio(target, baseline, scenario) {
  if (target.skipped || baseline.skipped) return 'n/a';
  // Memory: less is better, speed: more is better
  const value = scenario.kind === 'memory' ? baseline.value / target.value : target.value / baseline.value;
  return `${value.toFixed(2)}x`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const builds = [resolveBuild(args.target)];
  if (args.baseline) builds.push(resolveBuild(args.baseline));

  const dir = path.join(__dirname, 'scenarios');
  const files = fs.readdirSync(dir)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => path.join(dir, file))
    .filter((file) => !args.filter || new RegExp(args.filter).test(path.basename(file)));

  console.log(`Node ${process.version}, ${os.cpus()[0].model.trim()}, ${os.cpus().length} cores`);
  console.log('Speed is measured in operations per second (more is better), memory in bytes per entity (less is better).\n');

  const header = ['Scenario', ...builds.map((build) => build.name)];
  if (builds.length > 1) header.push('Ratio');
  console.log(`| ${header.join(' | ')} |`);
  console.log(`|${header.map((_, i) => (i === 0 ? ' :--- ' : ' ---: ')).join('|')}|`);

  for (const file of files) {
    const scenario = require(file);
    const results = builds.map((build) => runScenario(file, build, args.time));
    const row = [`${scenario.name}`, ...results.map((result) => format(result, scenario))];
    if (builds.length > 1) row.push(ratio(results[0], results[1], scenario));
    console.log(`| ${row.join(' | ')} |`);
  }

  console.log('\nScenarios:');
  for (const file of files) {
    const scenario = require(file);
    console.log(`- ${scenario.name}: ${scenario.description}`);
  }
}

main();
