/**
 * Message dispatched when the snake eats food
 */
export class FoodEaten {
  public constructor(public readonly length: number) {}
}

/**
 * Message dispatched when the snake hits a wall or itself
 */
export class GameOver {}
