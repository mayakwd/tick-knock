import {Measurement} from './Measure';
import {Scenario} from './Scenario';

/**
 * Metric of a benchmark in Bencher Metric Format
 * @see https://bencher.dev/docs/reference/bencher-metric-format/
 */
interface Metric {
  value: number;
  lower_value?: number;
  upper_value?: number;
}

/**
 * Results in Bencher Metric Format: benchmark name → measure slug → metric
 */
export type BencherMetricFormat = Record<string, Record<string, Metric>>;

/**
 * Built-in Bencher measure of speed, in operations per second
 */
const THROUGHPUT = 'throughput';
/**
 * Custom measure of memory, in bytes per entity
 */
const MEMORY = 'memory-per-entity';

/**
 * Collects results for Bencher. Every scenario of every library is a separate benchmark, named
 * `library: scenario`, so results of every library can be tracked and compared over time.
 */
export class BencherReport {
  private readonly results: BencherMetricFormat = {};

  public constructor(private readonly libraries: ReadonlyArray<string>) {}

  /**
   * Adds measurements of the scenario, one per library. Undefined means that the scenario is not implemented.
   */
  public add(scenario: Scenario, measurements: ReadonlyArray<Measurement | undefined>): void {
    measurements.forEach((measurement, index) => {
      if (measurement === undefined) return;
      const {value, deviation} = measurement;
      const metric: Metric = deviation > 0
        ? {value, lower_value: value * (1 - deviation), upper_value: value * (1 + deviation)}
        : {value};
      this.results[`${this.libraries[index]}: ${scenario.id}`] = {
        [scenario.kind === 'memory' ? MEMORY : THROUGHPUT]: metric,
      };
    });
  }

  public toJSON(): BencherMetricFormat {
    return this.results;
  }
}
