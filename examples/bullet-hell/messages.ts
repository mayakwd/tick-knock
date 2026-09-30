export class EnemyDestroyed {
  public constructor(public readonly points: number) {}
}

export class PlayerHit {
  public constructor(public readonly livesLeft: number) {}
}

export class GameOver {}
