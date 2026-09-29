import * as fs from 'fs';
import * as path from 'path';
import {BenchmarkFactory, ScenarioId} from '../Scenario';

/**
 * ECS library adapter. It implements scenarios in the idiomatic way for the library.
 * Scenarios that are not supported by the library are left undefined.
 */
export interface Library {
  /**
   * Name of the library that is shown in the report
   */
  readonly name: string;
  /**
   * Version of the library
   */
  readonly version: string;
  /**
   * Scenarios implemented by the library
   */
  readonly scenarios: Partial<Record<ScenarioId, BenchmarkFactory>>;
}

/**
 * Reads version of the installed package.
 * Package.json is read directly, because packages with `exports` field don't allow to require it.
 *
 * @param packageName Name of the package in node_modules of the benchmark
 */
export function getPackageVersion(packageName: string): string {
  const packagePath = path.join(__dirname, '..', '..', 'node_modules', packageName, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
}
