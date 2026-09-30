import {Game, GameOptions} from '../shared/ecs/Game';
import {GridIndex} from '../shared/indexes/GridIndex';
import {ViewPositionSystem} from '../shared/render/ViewPositionSystem';
import {ViewSystem} from '../shared/render/ViewSystem';
import {CooldownSystem} from '../shared/systems/CooldownSystem';
import {DestroySystem} from '../shared/systems/DestroySystem';
import {CELL, COLUMNS, ROWS} from './config';
import {Construction} from './Construction';
import {CreepIndex} from './indexes/CreepIndex';
import {TowerEntry} from './indexes/TowerEntry';
import {HealthBarSystem} from './render/HealthBarSystem';
import {
  AutopilotSystem,
  ConstructionSystem,
  CreepIndexSystem,
  DamageSystem,
  DeathSystem,
  EscapeSystem,
  FireSystem,
  GameOverSystem,
  PathSystem,
  PoisonSystem,
  ProjectileSystem,
  RewardSystem,
  SlowSystem,
  SpawnSystem,
  TargetFirstSystem,
  TargetStrongestSystem,
  TowerIndexSystem,
  TowerLevelSystem,
} from './systems';
import {TowerDefenseControls} from './TowerDefenseControls';
import {TowerDefenseState} from './TowerDefenseState';

/**
 * Tower defense: the engine with all systems in the order of the update. The game doesn't read input: the page or
 * the autopilot writes orders into the controls, and systems carry them out. Waves are the same in every game, so it
 * doesn't need random numbers.
 */
export class TowerDefenseGame extends Game<TowerDefenseState> {
  /**
   * Rules of building, also read by the page for the preview
   */
  public readonly construction: Construction;

  public constructor({layer, controls}: GameOptions<TowerDefenseControls>) {
    super(new TowerDefenseState());
    const creeps = new CreepIndex(COLUMNS, ROWS, CELL);
    const towers = new GridIndex<TowerEntry>(COLUMNS, ROWS);
    this.construction = new Construction(this.state, towers);

    this.engine
      // Indexes follow cells: an entity crossing into another cell gets a new Cell
      .addSystem(new CreepIndexSystem(creeps))
      .addSystem(new TowerIndexSystem(towers))

      // Towers are ordered by the autopilot or the player, built, and equipped for their level
      .addSystem(new AutopilotSystem(controls, this.construction))
      .addSystem(new ConstructionSystem(controls, this.state, this.construction))
      .addSystem(new TowerLevelSystem())

      // Creeps of the wave appear, walk the path, and take a life when they escape
      .addSystem(new SpawnSystem(this.state))
      .addSystem(new PathSystem())
      .addSystem(new EscapeSystem(this.state))

      // Towers choose targets and fire when their cooldowns are over, projectiles deliver payloads
      .addSystem(new TargetFirstSystem(creeps))
      .addSystem(new TargetStrongestSystem(creeps))
      .addSystem(new CooldownSystem())
      .addSystem(new FireSystem())
      .addSystem(new ProjectileSystem(creeps))

      // Effects are dealt, creeps without health die, and killed creeps give gold
      .addSystem(new DamageSystem())
      .addSystem(new SlowSystem())
      .addSystem(new PoisonSystem())
      .addSystem(new DeathSystem())
      .addSystem(new RewardSystem(this.state))

      // The game is over when the last life is lost, destroyed entities are removed after the update
      .addSystem(new GameOverSystem(this.state))
      .addSystem(new DestroySystem())

      // Views follow entities, creeps show their health and effects
      .addSystem(new ViewSystem(layer))
      .addSystem(new ViewPositionSystem())
      .addSystem(new HealthBarSystem());
  }
}
