import {Engine, Entity} from 'tick-knock';
import {isWithin} from '../shared/geometry';
import {Cell, Creep, Health, Hit, Payload, PathFollower, Poison, Position, Slow, Target, Tower, Weapon} from './components';
import {START_GOLD, START_LIVES} from './config';
import {Economy} from './Economy';
import {createProjectile, createTower} from './entities';
import {isBuildable} from './map';
import {CreepEscaped, CreepKilled, GameOver} from './messages';
import {SpatialIndex} from './SpatialIndex';
import {PathSystem, ProjectileSystem, SpawnSystem, WaveState} from './systems';
import {TARGET_FIRST, TARGET_STRONGEST} from './tags';
import {TowerKind, TowerLevel, TOWERS} from './towers';

export interface TowerDefenseGameOptions {
  /**
   * Adds systems of the host, for example rendering. It's called before the first entities are created,
   * so reaction systems of the host receive all entities.
   */
  setup?: (engine: Engine) => void;
}

/**
 * Tower defense without rendering and input
 */
export interface TowerDefenseGame {
  readonly engine: Engine;
  readonly economy: Readonly<Economy>;
  readonly wave: number;
  readonly isOver: boolean;

  /**
   * Gets the tower built in the cell
   */
  towerAt(cell: Cell): Tower | undefined;

  /**
   * Gets the level the tower in the cell would have after an upgrade, or undefined if there is no tower,
   * or it has the last level
   */
  nextLevel(cell: Cell): TowerLevel | undefined;

  /**
   * Returns a value indicating whether a tower of the kind can be built in the cell right now
   */
  canBuild(kind: TowerKind, cell: Cell): boolean;

  /**
   * Returns a value indicating whether the tower in the cell can be upgraded right now
   */
  canUpgrade(cell: Cell): boolean;

  /**
   * Builds a tower of the first level, if it's possible
   * @returns true if the tower is built
   */
  build(kind: TowerKind, cell: Cell): boolean;

  /**
   * Upgrades the tower in the cell to the next level, if it's possible
   * @returns true if the tower is upgraded
   */
  upgrade(cell: Cell): boolean;

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
}

export const Priority = {
  Spawn: 0,
  Movement: 1,
  Targeting: 2,
  Firing: 3,
  Projectiles: 4,
  Effects: 5,
  Death: 6,
  Render: 100,
} as const;

export function createTowerDefenseGame({setup}: TowerDefenseGameOptions = {}): TowerDefenseGame {
  const engine = new Engine();
  const economy: Economy = {gold: START_GOLD, lives: START_LIVES};
  const waves: WaveState = {number: 1};
  const creeps = new SpatialIndex();
  const towers = new SpatialIndex();
  let isOver = false;

  // #region indexes
  // Spatial indexes follow cells of entities: an entity is indexed when it gets a cell, and a creep crossing into
  // another cell gets a new one, so it's removed from the previous cell and added to the next one. A creep, that has
  // lost its health, is not a target anymore, and leaves the index right away.
  engine
    .reactive([Cell, Health, Creep], {
      added: ({current}, cell) => creeps.add(cell, current),
      removed: ({current}, cell) => creeps.remove(cell, current),
    }, {id: 'creep-index'})
    .reactive([Cell, Tower], {
      added: ({current}, cell) => towers.add(cell, current),
      removed: ({current}, cell) => towers.remove(cell, current),
    }, {id: 'tower-index'});
  // #endregion indexes

  // #region levels
  // A level of a tower is turned into its components when the tower is built, and when an upgrade replaces its Tower.
  // It's the only place, where the table of towers is read: from this moment the tower owns its characteristics.
  engine.reactive([Tower], {
    added: ({current}, {kind, level}) => {
      const {targeting, levels} = TOWERS[kind];
      const {range, interval, projectileSpeed, payload} = levels[level];
      current
        .add(new Weapon(range, interval, projectileSpeed))
        .add(new Payload(payload))
        .add(targeting);
    },
  }, {id: 'tower-levels'});
  // #endregion levels

  // #region targeting
  // A tower keeps its target while it's alive and in range
  const keepsTarget = ({entity}: Target, position: Position, range: number) =>
    entity !== undefined && creeps.has(entity) && isWithin(position, entity.get(Position)!, range);

  // Candidates are only creeps in cells around the tower, which the spatial index gives
  const bestInRange = (position: Position, range: number, score: (creep: Entity) => number) => {
    let best: Entity | undefined;
    let bestScore = -Infinity;
    creeps.forEachWithin(position, range, (creep) => {
      const value = score(creep);
      if (value <= bestScore) return;
      best = creep;
      bestScore = value;
    });
    return best;
  };
  const progress = (creep: Entity) => creep.get(PathFollower)!.distance;
  const health = (creep: Entity) => creep.get(Health)!.value;
  // #endregion targeting

  // #region systems
  engine
    .addSystem(new SpawnSystem(waves), {priority: Priority.Spawn, id: 'spawn'})
    .addSystem(new PathSystem(), {priority: Priority.Movement, id: 'path'})
    // Every rule of choosing a target is a tag with its own system
    .iterative([Position, Weapon, Target, TARGET_FIRST], (tower, dt, position, {range}, target) => {
      if (!keepsTarget(target, position, range)) target.entity = bestInRange(position, range, progress);
    }, {priority: Priority.Targeting, id: 'target-first'})
    .iterative([Position, Weapon, Target, TARGET_STRONGEST], (tower, dt, position, {range}, target) => {
      if (!keepsTarget(target, position, range)) target.entity = bestInRange(position, range, health);
    }, {priority: Priority.Targeting, id: 'target-strongest'})
    // A tower fires at its target, when its weapon is ready
    .iterative([Position, Weapon, Target, Payload], (tower, dt, position, weapon, {entity}, payload) => {
      weapon.cooldown.tick(dt);
      if (entity === undefined || !weapon.cooldown.isReady) return;
      weapon.cooldown.restart();
      engine.addEntity(createProjectile(position, entity, weapon.projectileSpeed, payload));
    }, {priority: Priority.Firing, id: 'firing'})
    .addSystem(new ProjectileSystem(creeps), {priority: Priority.Projectiles, id: 'projectiles'})
    // Every effect is a linked component with its own system. Hits are dealt once.
    .iterative([Hit, Health], (creep, dt, first, health) => {
      creep.iterate(Hit, (hit) => {
        health.value -= hit.damage;
      });
      creep.remove(Hit);
    }, {priority: Priority.Effects, id: 'hits'})
    // Every slow expires on its own, so all of them are iterated, and expired ones are picked one by one
    .iterative([Slow], (creep, dt) => {
      creep.iterate(Slow, (slow) => {
        slow.seconds -= dt;
        if (slow.seconds <= 0) creep.pick(slow);
      });
    }, {priority: Priority.Effects, id: 'slowing'})
    // Poisons stack: every poison deals its damage until it expires
    .iterative([Poison, Health], (creep, dt, first, health) => {
      creep.iterate(Poison, (poison) => {
        health.value -= poison.damagePerSecond * Math.min(dt, poison.seconds);
        poison.seconds -= dt;
        if (poison.seconds <= 0) creep.pick(poison);
      });
    }, {priority: Priority.Effects, id: 'poisoning'})
    // Death runs after all damage of the update has been dealt, so the reward is given once
    .iterative([Health, Creep], (creep, dt, health, {reward}) => {
      if (health.value > 0) return;
      engine.removeEntity(creep);
      engine.dispatch(new CreepKilled(reward));
    }, {priority: Priority.Death, id: 'death'});
  // #endregion systems

  engine.subscribe(CreepKilled, ({reward}) => {
    economy.gold += reward;
  });
  engine.subscribe(CreepEscaped, () => {
    economy.lives = Math.max(0, economy.lives - 1);
    if (economy.lives === 0) engine.dispatch(new GameOver());
  });
  engine.subscribe(GameOver, () => {
    isOver = true;
  });

  // #region actions
  // Towers are found in the spatial index of towers, a cell has one tower at most
  const towerEntityAt = (cell: Cell) => towers.at(cell)[0];

  const nextLevel = (cell: Cell) => {
    const tower = towerEntityAt(cell)?.get(Tower);
    return tower && TOWERS[tower.kind].levels[tower.level + 1];
  };

  const canBuild = (kind: TowerKind, cell: Cell) =>
    !isOver && economy.gold >= TOWERS[kind].levels[0].cost && isBuildable(cell) && towerEntityAt(cell) === undefined;

  const canUpgrade = (cell: Cell) => {
    const level = nextLevel(cell);
    return !isOver && level !== undefined && economy.gold >= level.cost;
  };

  const build = (kind: TowerKind, cell: Cell) => {
    if (!canBuild(kind, cell)) return false;
    economy.gold -= TOWERS[kind].levels[0].cost;
    engine.addEntity(createTower(kind, cell));
    return true;
  };

  // An upgrade replaces the Tower component, and the tower gets components of the next level
  const upgrade = (cell: Cell) => {
    const entity = towerEntityAt(cell);
    if (entity === undefined || !canUpgrade(cell)) return false;
    const {kind, level} = entity.get(Tower)!;
    economy.gold -= nextLevel(cell)!.cost;
    entity.add(new Tower(kind, level + 1));
    return true;
  };
  // #endregion actions

  setup?.(engine);

  return {
    engine,
    economy,
    get wave() {
      return waves.number;
    },
    get isOver() {
      return isOver;
    },
    towerAt: (cell) => towerEntityAt(cell)?.get(Tower),
    nextLevel,
    canBuild,
    canUpgrade,
    build,
    upgrade,
    update(dt: number) {
      if (!isOver) engine.update(dt);
    },
  };
}
