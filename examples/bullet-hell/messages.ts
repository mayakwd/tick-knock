export class EnemyDestroyed {
  public constructor(public readonly points: number) {}
}

/**
 * Message dispatched when the player loses a life
 */
export class PlayerHit {}

export class GameOver {}
