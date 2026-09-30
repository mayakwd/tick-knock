import * as os from 'os';
import {Measurement} from './Measure';
import {Scenario} from './Scenario';

/**
 * Column of the report, one per benchmarked library or tick-knock build
 */
export interface ReportColumn {
  readonly title: string;
}

/**
 * Results of a scenario for every column. Undefined means that the scenario is not implemented by the library.
 */
export interface ReportRow {
  readonly scenario: Scenario;
  readonly measurements: ReadonlyArray<Measurement | undefined>;
}

/**
 * Formats benchmark results as a markdown report
 */
export class Report {
  private readonly rows: ReportRow[] = [];

  /**
   * @param columns Columns of the report
   * @param environment Description of the environment the results were measured in, the current machine by default
   */
  public constructor(private readonly columns: ReadonlyArray<ReportColumn>, private readonly environment = describeMachine()) {}

  /**
   * Gets header of the report with environment description and table header
   */
  public get header(): string {
    return [
      this.environment,
      '',
      'Speed is measured in operations per second (more is better), memory in bytes per entity (less is better).',
      'The best result in every scenario is marked with bold, "–" means that scenario is not implemented by the library.',
      '',
      `| Scenario | ${this.columns.map((column) => column.title).join(' | ')} |`,
      `| :--- |${this.columns.map(() => ' ---: |').join('')}`,
    ].join('\n');
  }

  /**
   * Adds a row to the report
   * @returns Formatted row
   */
  public addRow(row: ReportRow): string {
    this.rows.push(row);
    const best = findBest(row);
    const cells = row.measurements.map((measurement) => {
      if (measurement === undefined) return '–';
      const text = row.scenario.kind === 'memory' ? `${formatNumber(measurement.value)} B` : formatSpeed(measurement);
      return measurement === best ? `**${text}**` : text;
    });
    return `| ${row.scenario.name} | ${cells.join(' | ')} |`;
  }

  /**
   * Gets description of scenarios that were added to the report
   */
  public get footer(): string {
    return ['', 'Scenarios:', ...this.rows.map(({scenario}) => `- **${scenario.name}**: ${scenario.description}`)].join('\n');
  }
}

function describeMachine(): string {
  const cpus = os.cpus();
  return `Node ${process.version}, ${cpus[0]?.model.trim() ?? 'unknown CPU'}, ${cpus.length} cores`;
}

function findBest(row: ReportRow): Measurement | undefined {
  const measurements = row.measurements.filter((value): value is Measurement => value !== undefined);
  if (measurements.length < 2) return undefined;
  const better = row.scenario.kind === 'memory'
    ? (a: Measurement, b: Measurement) => a.value < b.value
    : (a: Measurement, b: Measurement) => a.value > b.value;
  return measurements.reduce((best, value) => (better(value, best) ? value : best));
}

function formatSpeed(measurement: Measurement): string {
  const value = formatNumber(measurement.value);
  return measurement.deviation > 0 ? `${value} ±${(measurement.deviation * 100).toFixed(1)}%` : value;
}

function formatNumber(value: number): string {
  return value >= 100 ? Math.round(value).toLocaleString('en-US') : value.toFixed(1);
}
