import {Entity, QueryBuilder, System} from 'tick-knock';
import {isWithin} from '../../shared/geometry';
import {Collider, Enemy, Hit, Invulnerable, Position} from '../components';
import {destroy} from '../entities';
import {ENEMY_BULLET, PLAYER, PLAYER_BULLET} from '../tags';

/**
 * Detects hits of player bullets on enemies, and hits of enemies and their bullets on the player. The system only
 * reports hits: a bullet that hits is destroyed, and the hit entity gets a `Hit`. What a hit does is decided by
 * systems of enemies and of the player.
 *
 * There is only one player, so checking thousands of enemy bullets against it is a single pass over the query.
 */
export class CollisionSystem extends System {
  private readonly players = new QueryBuilder().contains(Position, Collider, PLAYER).build();
  private readonly enemies = new QueryBuilder().contains(Position, Collider, Enemy).build();
  private readonly playerBullets = new QueryBuilder().contains(Position, Collider, PLAYER_BULLET).build();
  private readonly enemyBullets = new QueryBuilder().contains(Position, Collider, ENEMY_BULLET).build();

  public onAddedToEngine(): void {
    for (const query of this.queries) this.engine.addQuery(query);
  }

  public onRemovedFromEngine(): void {
    for (const query of this.queries) this.engine.removeQuery(query);
  }

  public update(): void {
    this.enemies.forEach((enemy, enemyPosition, enemyCollider) => {
      this.playerBullets.forEach((bullet, bulletPosition, bulletCollider) => {
        if (!isWithin(enemyPosition, bulletPosition, enemyCollider.radius + bulletCollider.radius)) return;
        destroy(this.engine, bullet);
        enemy.append(new Hit());
      });
    });

    this.players.forEach((player, playerPosition, playerCollider) => {
      // Bullets fly through the invulnerable player
      if (player.has(Invulnerable)) return;
      const hit = (other: Entity, position: Position, collider: Collider) => {
        if (!isWithin(playerPosition, position, playerCollider.radius + collider.radius)) return;
        if (other.has(ENEMY_BULLET)) destroy(this.engine, other);
        player.append(new Hit());
      };
      this.enemyBullets.forEach(hit);
      this.enemies.forEach(hit);
    });
  }

  private get queries() {
    return [this.players, this.enemies, this.playerBullets, this.enemyBullets];
  }
}
