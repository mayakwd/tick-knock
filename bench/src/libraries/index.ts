import {createApeEcsLibrary} from './ApeEcs';
import {createBitEcsLibrary} from './BitEcs';
import {createEcsyLibrary} from './Ecsy';
import {Library} from './Library';
import {createMiniplexLibrary} from './Miniplex';
import {createSimEcsLibrary} from './SimEcs';
import {createTickKnockLibrary} from './TickKnock';

/**
 * Other ECS libraries, the benchmark compares tick-knock with
 */
export const otherLibraries = {
  'ape-ecs': createApeEcsLibrary,
  'bitecs': createBitEcsLibrary,
  'ecsy': createEcsyLibrary,
  'miniplex': createMiniplexLibrary,
  'sim-ecs': createSimEcsLibrary,
};

export type OtherLibraryId = keyof typeof otherLibraries;

/**
 * Serializable description of a library, passed to a worker process
 */
export type LibraryDescriptor =
  | { id: 'tick-knock'; name: string; path: string }
  | { id: OtherLibraryId };

/**
 * Creates library adapter by its description
 */
export function createLibrary(descriptor: LibraryDescriptor): Library {
  if (descriptor.id === 'tick-knock') {
    return createTickKnockLibrary(descriptor.name, descriptor.path);
  }
  return otherLibraries[descriptor.id]();
}

/**
 * Returns a value indicating whether the identifier belongs to one of other libraries
 */
export function isOtherLibraryId(id: string): id is OtherLibraryId {
  return id in otherLibraries;
}

export * from './Library';
