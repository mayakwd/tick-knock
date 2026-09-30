import {Engine, Entity, Query, QueryBuilder} from 'tick-knock';
import {Creep, Health, Poison, Slow, Tower} from './components';
import {START_GOLD, START_LIVES} from './config';
import {Economy} from './Economy';
import {createTower, equipTower} from './entities';
import {Cell, isBuildable} from './map';
import {CreepEscaped, CreepKilled, GameOver} from './messages';
import {PathSystem, ProjectileSystem, SpawnSystem, TowerSystem, WaveState} from './systems';
import {TowerKind, TOWERS} from './towers';

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
   * Returns a value indicating whether a tower of the kind can be built in the cell right now
   */
  canBuild(kind: TowerKind, cell: Cell): boolean;

  /**
   * Builds a tower of the first level, if it's possible
   * @returns true if the tower is built
   */
  build(kind: TowerKind, cell: Cell): boolean;

  /**
   * Gets the cost of upgrading the tower in the cell, or undefined if there is no tower or it has the last level
   */
  upgradeCost(cell: Cell): number | undefined;

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
  Towers: 2,
  Projectiles: 3,
  Effects: 4,
  Death: 5,
  Render: 100,
} as const;

export function createTowerDefenseGame({setup}: TowerDefenseGameOptions = {}): TowerDefenseGame {
  const engine = new Engine();
  const economy: Economy = {gold: START_GOLD, lives: START_LIVES};
  const waves: WaveState = {number: 1};
  const towers: Query<[Tower]> = new QueryBuilder().contains(Tower).build();
  engine.addQuery(towers);
  let isOver = false;

  // #region systems
  engine
    .addSystem(new SpawnSystem(waves), {priority: Priority.Spawn, id: 'spawn'})
    .addSystem(new PathSystem(), {priority: Priority.Movement, id: 'path'})
    .addSystem(new TowerSystem(), {priority: Priority.Towers, id: 'towers'})
    .addSystem(new ProjectileSystem(), {priority: Priority.Projectiles, id: 'projectiles'})
    // Every slow expires on its own, so all of them are iterated, and expired ones are picked one by one
    .iterative([Slow], (creep, dt) => {
      creep.iterate(Slow, (slow) => {
        slow.seconds -= dt;
        if (slow.seconds <= 0) creep.pick(slow);
      });
    }, {priority: Priority.Effects, id: 'slowing'})
    // Poisons stack: every poison deals its damage until it expires
    .iterative([Poison, Health], (creep, dt, poison, health) => {
      creep.iterate(Poison, (it) => {
        health.value -= it.damagePerSecond * Math.min(dt, it.seconds);
        it.seconds -= dt;
        if (it.seconds <= 0) creep.pick(it);
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
  const towerEntityAt = (cell: Cell): Entity | undefined => towers.find((entity) => {
    const tower = entity.get(Tower)!;
    return tower.cell.column === cell.column && tower.cell.row === cell.row;
  });

  const canBuild = (kind: TowerKind, cell: Cell) =>
    !isOver && economy.gold >= TOWERS[kind].levels[0].cost && isBuildable(cell) && towerEntityAt(cell) === undefined;

  const upgradeCost = (cell: Cell) => {
    const tower = towerEntityAt(cell)?.get(Tower);
    return tower && TOWERS[tower.kind].levels[tower.level + 1]?.cost;
  };

  const build = (kind: TowerKind, cell: Cell) => {
    if (!canBuild(kind, cell)) return false;
    economy.gold -= TOWERS[kind].levels[0].cost;
    engine.addEntity(createTower(kind, cell));
    return true;
  };

  // An upgrade replaces components of the tower with components of the next level
  const upgrade = (cell: Cell) => {
    const entity = towerEntityAt(cell);
    const cost = upgradeCost(cell);
    if (isOver || entity === undefined || cost === undefined || economy.gold < cost) return false;
    const {kind, level} = entity.get(Tower)!;
    economy.gold -= cost;
    equipTower(entity, kind, cell, level + 1);
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
    canBuild,
    build,
    upgradeCost,
    upgrade,
    update(dt: number) {
      if (!isOver) engine.update(dt);
    },
  };
}
