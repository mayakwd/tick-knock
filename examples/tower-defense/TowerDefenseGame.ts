import {Query, QueryBuilder} from 'tick-knock';
import {Game, GameOptions} from '../shared/ecs/Game';
import {GridIndex} from '../shared/indexes/GridIndex';
import {ViewPositionSystem} from '../shared/render/ViewPositionSystem';
import {ViewSystem} from '../shared/render/ViewSystem';
import {CooldownSystem} from '../shared/systems/CooldownSystem';
import {DestroySystem} from '../shared/systems/DestroySystem';
import {CELL, COLUMNS, ROWS} from './config';
import {WaveStats} from './components';
import {Construction} from './Construction';
import {createSpawner} from './entities';
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
  NextWaveSystem,
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
import {SPAWNER} from './tags';
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
  private readonly spawners: Query<[WaveStats]> = new QueryBuilder().with(WaveStats, SPAWNER).build();

  public constructor({layer, controls}: GameOptions<TowerDefenseControls>) {
    super(new TowerDefenseState());
    const creeps = new CreepIndex(COLUMNS, ROWS, CELL);
    const towers = new GridIndex<TowerEntry>(COLUMNS, ROWS);
    this.construction = new Construction(this.state, towers);

    this.engine
      // Cooldowns of the spawner and towers are counted down before anybody acts
      .addSystem(new CooldownSystem())

      // Indexes follow cells: an entity crossing into another cell gets a new Cell
      .addSystem(new CreepIndexSystem(creeps))
      .addSystem(new TowerIndexSystem(towers))

      // Towers are ordered by the autopilot or the player, built, and equipped for their level
      .addSystem(new AutopilotSystem(controls, this.construction))
      .addSystem(new ConstructionSystem(controls, this.state, this.construction))
      .addSystem(new TowerLevelSystem())

      // The next wave starts when the previous one is over, creeps of the wave appear, walk the path, and take a life
      // when they escape
      .addSystem(new NextWaveSystem())
      .addSystem(new SpawnSystem())
      .addSystem(new PathSystem())
      .addSystem(new EscapeSystem(this.state))

      // Towers choose targets and fire when their cooldowns are over, projectiles deliver payloads
      .addSystem(new TargetFirstSystem(creeps))
      .addSystem(new TargetStrongestSystem(creeps))
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

    this.engine.addQuery(this.spawners);
    this.engine.addEntity(createSpawner());
  }

  /**
   * Number of the current wave, it's kept by the spawner
   */
  public get wave(): number {
    return this.spawners.first?.get(WaveStats)?.number ?? 0;
  }
}
