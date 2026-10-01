import {Game} from '../shared/ecs/Game';

/**
 * Plays the game until it's over or the time is up. Controls of a new game belong to the autopilot, so it plays.
 *
 * @param seconds The longest time to play
 * @param check Called after every update with the time played
 * @param dt Time of an update in seconds
 * @returns Time played in seconds
 */
export function play(
  game: Game,
  seconds: number,
  check: (time: number) => void = () => {},
  dt: number = 1 / 60,
): number {
  const updates = Math.round(seconds / dt);
  let update = 0;
  while (update < updates && !game.isOver) {
    game.update(dt);
    update++;
    check(update * dt);
  }
  return update * dt;
}
