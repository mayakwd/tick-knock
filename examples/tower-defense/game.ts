import {Engine, Entity} from 'tick-knock';
import {Container} from 'pixi.js';
import {Cooldown} from '../shared/Cooldown';
import {CooldownSystem} from '../shared/CooldownSystem';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {Cell, Creep, Health, Hit, Payload, Poison, Position, Slow, Target, Tower, Weapon} from './components';
import {Economy} from './Economy';
import {createProjectile, createTower} from './entities';
import {isBuildable} from './map';
import {CreepEscaped, CreepKilled, GameOver} from './messages';
import {CreepViewRef} from './render/CreepViewRef';
import {drawTower} from './render/graphics';
import {SpatialIndex} from './SpatialIndex';
import {PathSystem, ProjectileSystem, SpawnSystem, TargetFirstSystem, TargetStrongestSystem, WaveState} from './systems';
import {TowerKind, TowerLevel, TOWERS} from './towers';

export interface TowerDefenseGameOptions {
  /**
   * Layer views of entities are added to
   */
  layer: Container;
}

/**
 * Tower defense: the engine with all systems, and actions of the player. It doesn't read input, so it runs in the
 * browser and in tests as is.
 */
export class TowerDefenseGame {
  public readonly engine = new Engine();
  public readonly economy = new Economy();
  private readonly waves = new WaveState();
  /**
   * Creeps that can be targeted, and towers, indexed by their cells
   */
  private readonly creeps = new SpatialIndex();
  private readonly towers = new SpatialIndex();
  private _isOver = false;

  public constructor({layer}: TowerDefenseGameOptions) {
    // Spatial indexes follow cells of entities: an entity is indexed when it gets a cell, and a creep crossing into
    // another cell gets a new one, so it's removed from the previous cell and added to the next one. A creep, that
    // has lost its health, is not a target anymore, and leaves the index right away.
    this.engine
      .reactive([Cell, Health, Creep], {
        added: ({current}, cell) => this.creeps.add(cell, current),
        removed: ({current}, cell) => this.creeps.remove(cell, current),
      })
      .reactive([Cell, Tower], {
        added: ({current}, cell) => this.towers.add(cell, current),
        removed: ({current}, cell) => this.towers.remove(cell, current),
      });

    // A level of a tower is turned into its components when the tower is built, and when an upgrade replaces its
    // Tower. It's the only place, where the table of towers is read: from this moment the tower owns its
    // characteristics, and the view shows its level.
    this.engine.reactive([Tower], {
      added: ({current}, {kind, level}) => {
        const {targeting, levels} = TOWERS[kind];
        const {range, interval, projectileSpeed, payload} = levels[level];
        current
          .add(new Weapon(range, projectileSpeed))
          .add(new Cooldown(interval))
          .add(new Payload(payload))
          .add(new View(drawTower(kind, level)))
          .add(targeting);
      },
    });

    this.engine
      // Creeps appear and walk along the path
      .addSystem(new SpawnSystem(this.waves))
      .addSystem(new PathSystem())

      // Towers choose targets: every rule of choosing a target is a tag with its own system
      .addSystem(new TargetFirstSystem(this.creeps))
      .addSystem(new TargetStrongestSystem(this.creeps))

      // A tower fires at its target, when its cooldown is over
      .addSystem(new CooldownSystem())
      .iterative(
        [Position, Weapon, Target, Payload, Cooldown],
        (tower, dt, position, weapon, target, payload, cooldown) => {
          if (target.entity === undefined || cooldown.remaining > 0) return;

          cooldown.remaining += cooldown.interval;
          this.engine.addEntity(createProjectile(position, target.entity, weapon.projectileSpeed, payload));
        },
      )

      // Projectiles fly to their targets, and hit creeps with their payload
      .addSystem(new ProjectileSystem(this.creeps))

      // Every effect is a linked component with its own system. Hits are dealt once.
      .iterative([Hit, Health], (creep, dt, first, health) => {
        creep.iterate(Hit, (hit) => {
          health.value -= hit.damage;
        });
        creep.remove(Hit);
      })

      // Every slow expires on its own, so all of them are iterated, and expired ones are picked one by one
      .iterative([Slow], (creep, dt) => {
        creep.iterate(Slow, (slow) => {
          slow.seconds -= dt;
          if (slow.seconds <= 0) creep.pick(slow);
        });
      })

      // Poisons stack: every poison deals its damage until it expires
      .iterative([Poison, Health], (creep, dt, first, health) => {
        creep.iterate(Poison, (poison) => {
          health.value -= poison.damagePerSecond * Math.min(dt, poison.seconds);
          poison.seconds -= dt;
          if (poison.seconds <= 0) creep.pick(poison);
        });
      })

      // Death runs after all damage of the update has been dealt, so the reward is given once
      .iterative([Health, Creep], (creep, dt, health, {reward}) => {
        if (health.value > 0) return;

        this.engine.removeEntity(creep);
        this.engine.dispatch(new CreepKilled(reward));
      });

    // Views follow positions of entities after all game systems, and creeps show their health and effects
    addViews(this.engine, layer, {position: Position});
    this.engine.iterative([CreepViewRef, Health], (creep, dt, {view}, health) => {
      view.setHealth(health.value / health.max);
      view.setEffects(creep.has(Slow), creep.has(Poison));
    });

    this.engine.subscribe(CreepKilled, ({reward}) => {
      this.economy.gold += reward;
    });

    this.engine.subscribe(CreepEscaped, () => {
      this.economy.lives = Math.max(0, this.economy.lives - 1);
      if (this.economy.lives === 0) this.engine.dispatch(new GameOver());
    });

    this.engine.subscribe(GameOver, () => {
      this._isOver = true;
    });
  }

  public get wave(): number {
    return this.waves.number;
  }

  public get isOver(): boolean {
    return this._isOver;
  }

  /**
   * Gets the tower built in the cell
   */
  public towerAt(cell: Cell): Tower | undefined {
    return this.towerEntityAt(cell)?.get(Tower);
  }

  /**
   * Gets the level the tower in the cell would have after an upgrade, or undefined if there is no tower,
   * or it has the last level
   */
  public nextLevel(cell: Cell): TowerLevel | undefined {
    const tower = this.towerAt(cell);
    return tower && TOWERS[tower.kind].levels[tower.level + 1];
  }

  /**
   * Returns a value indicating whether a tower of the kind can be built in the cell right now
   */
  public canBuild(kind: TowerKind, cell: Cell): boolean {
    if (this._isOver || !isBuildable(cell) || this.towerEntityAt(cell) !== undefined) return false;
    return this.economy.gold >= TOWERS[kind].levels[0].cost;
  }

  /**
   * Returns a value indicating whether the tower in the cell can be upgraded right now
   */
  public canUpgrade(cell: Cell): boolean {
    const level = this.nextLevel(cell);
    return !this._isOver && level !== undefined && this.economy.gold >= level.cost;
  }

  /**
   * Builds a tower of the first level, if it's possible
   * @returns true if the tower is built
   */
  public build(kind: TowerKind, cell: Cell): boolean {
    if (!this.canBuild(kind, cell)) return false;

    this.economy.gold -= TOWERS[kind].levels[0].cost;
    this.engine.addEntity(createTower(kind, cell));
    return true;
  }

  /**
   * Upgrades the tower in the cell to the next level, if it's possible. The upgrade replaces the Tower component,
   * and the tower gets components of the next level.
   * @returns true if the tower is upgraded
   */
  public upgrade(cell: Cell): boolean {
    const entity = this.towerEntityAt(cell);
    if (entity === undefined || !this.canUpgrade(cell)) return false;

    const {kind, level} = entity.get(Tower)!;
    this.economy.gold -= this.nextLevel(cell)!.cost;
    entity.add(new Tower(kind, level + 1));
    return true;
  }

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (!this._isOver) this.engine.update(dt);
  }

  /**
   * A cell has one tower at most, it's found in the spatial index of towers
   */
  private towerEntityAt(cell: Cell): Entity | undefined {
    return this.towers.at(cell)[0];
  }
}
