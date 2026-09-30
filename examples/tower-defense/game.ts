import {Engine, Query, QueryBuilder} from 'tick-knock';
import {Creep, Health, Poison, Slow, Tower} from './components';
import {START_GOLD, START_LIVES} from './config';
import {Economy} from './Economy';
import {createTower} from './entities';
import {Cell, isBuildable} from './map';
import {CreepEscaped, CreepKilled, GameOver} from './messages';
import {death, PathSystem, poisoning, ProjectileSystem, slowing, SpawnSystem, TowerSystem, WaveState} from './systems';
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
   * Returns a value indicating whether a tower of the kind can be built in the cell right now
   */
  canBuild(kind: TowerKind, cell: Cell): boolean;

  /**
   * Builds a tower, if it's possible
   * @returns true if the tower is built
   */
  build(kind: TowerKind, cell: Cell): boolean;

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

  engine
    .addSystem(new SpawnSystem(waves), {priority: Priority.Spawn, id: 'spawn'})
    .addSystem(new PathSystem(), {priority: Priority.Movement, id: 'path'})
    .addSystem(new TowerSystem(), {priority: Priority.Towers, id: 'towers'})
    .addSystem(new ProjectileSystem(), {priority: Priority.Projectiles, id: 'projectiles'})
    .iterative([Slow], slowing, {priority: Priority.Effects, id: 'slowing'})
    .iterative([Poison, Health], poisoning, {priority: Priority.Effects, id: 'poisoning'})
    .iterative([Health, Creep], death(engine), {priority: Priority.Death, id: 'death'});

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

  const isFree = (cell: Cell) => towers.find((entity) => {
    const tower = entity.get(Tower)!;
    return tower.cell.column === cell.column && tower.cell.row === cell.row;
  }) === undefined;

  const canBuild = (kind: TowerKind, cell: Cell) =>
    !isOver && economy.gold >= TOWERS[kind].cost && isBuildable(cell) && isFree(cell);

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
    canBuild,
    build(kind: TowerKind, cell: Cell) {
      if (!canBuild(kind, cell)) return false;
      economy.gold -= TOWERS[kind].cost;
      engine.addEntity(createTower(kind, cell));
      return true;
    },
    update(dt: number) {
      if (!isOver) engine.update(dt);
    },
  };
}
