/**
 * Message dispatched when the snake eats food
 */
export class FoodEaten {
  public constructor(public readonly length: number) {}
}

/**
 * Message dispatched when the snake hits a wall or itself, or fills the whole board
 */
export class GameOver {
  public constructor(public readonly isWon: boolean = false) {}
}
