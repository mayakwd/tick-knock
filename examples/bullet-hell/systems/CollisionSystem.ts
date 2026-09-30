import {Entity, QueryBuilder, System} from 'tick-knock';
import {Collider, Enemy, Health, Invulnerable, Lives, Position, Reward} from '../components';
import {INVULNERABILITY_TIME} from '../config';
import {EnemyDestroyed, GameOver, PlayerHit} from '../messages';
import {ENEMY_BULLET, PLAYER, PLAYER_BULLET} from '../tags';

/**
 * Detects hits of player bullets on enemies, and hits of enemies and their bullets on the player.
 *
 * There is only one player, so checking thousands of enemy bullets against it is a single pass over the query.
 * Hit entities lose their colliders immediately: they leave collision queries and can't hit anything else
 * in the same update, and are removed from the engine after it.
 */
export class CollisionSystem extends System {
  private readonly players = new QueryBuilder().contains(Position, Collider, Lives, PLAYER).build();
  private readonly enemies = new QueryBuilder().contains(Position, Collider, Health, Reward, Enemy).build();
  private readonly playerBullets = new QueryBuilder().contains(Position, Collider, PLAYER_BULLET).build();
  private readonly enemyBullets = new QueryBuilder().contains(Position, Collider, ENEMY_BULLET).build();

  public onAddedToEngine(): void {
    for (const query of this.queries) this.engine.addQuery(query);
  }

  public onRemovedFromEngine(): void {
    for (const query of this.queries) this.engine.removeQuery(query);
  }

  public update(): void {
    this.enemies.forEach((enemy, enemyPosition, enemyCollider, health, {points}) => {
      this.playerBullets.forEach((bullet, bulletPosition, bulletCollider) => {
        if (health.value <= 0 || !collides(enemyPosition, enemyCollider, bulletPosition, bulletCollider)) return;
        this.destroy(bullet);
        if (--health.value <= 0) {
          this.destroy(enemy);
          this.dispatch(new EnemyDestroyed(points));
        }
      });
    });

    this.players.forEach((player, playerPosition, playerCollider, lives) => {
      if (player.has(Invulnerable)) return;
      const hit = (other: Entity, position: Position, collider: Collider) => {
        if (lives.count <= 0 || player.has(Invulnerable) || !collides(playerPosition, playerCollider, position, collider)) return;
        if (other.has(ENEMY_BULLET)) this.destroy(other);
        lives.count--;
        this.dispatch(new PlayerHit(lives.count));
        if (lives.count > 0) {
          player.add(new Invulnerable(INVULNERABILITY_TIME));
        } else {
          this.destroy(player);
          this.dispatch(new GameOver());
        }
      };
      this.enemyBullets.forEach(hit);
      this.enemies.forEach(hit);
    });
  }

  private get queries() {
    return [this.players, this.enemies, this.playerBullets, this.enemyBullets];
  }

  private destroy(entity: Entity): void {
    entity.remove(Collider);
    this.engine.removeEntity(entity);
  }
}

function collides(a: Position, aCollider: Collider, b: Position, bCollider: Collider): boolean {
  const distance = aCollider.radius + bCollider.radius;
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distance * distance;
}
