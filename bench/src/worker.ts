/**
 * Worker process entry point. Runs a single scenario of a single library and prints result as JSON.
 * Every scenario is executed in its own process, so JIT state of one scenario or library never affects another.
 *
 * Usage: node --expose-gc worker.js <library descriptor JSON> <scenario id> <time in ms>
 */
import {createLibrary, LibraryDescriptor} from './libraries';
import {measureMemory, measureSpeed, Measurement} from './Measure';
import {getScenario, Sizes} from './Scenario';

/**
 * Result of the worker. `measurement` is undefined if library doesn't implement the scenario.
 */
export interface WorkerResult {
  readonly measurement?: Measurement;
}

async function main(): Promise<void> {
  const [descriptor, scenarioId, time] = process.argv.slice(2);
  const library = createLibrary(JSON.parse(descriptor) as LibraryDescriptor);
  const scenario = getScenario(scenarioId);
  const factory = library.scenarios[scenario.id];
  let result: WorkerResult = {};
  if (factory !== undefined) {
    const benchmark = await factory();
    const measurement = scenario.kind === 'memory'
      ? await measureMemory(benchmark, Sizes.memoryEntities)
      : await measureSpeed(benchmark, Number(time));
    result = {measurement};
  }
  process.stdout.write(JSON.stringify(result));
  // Some libraries keep timers or pending promises, so exit explicitly
  process.exit(0);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
