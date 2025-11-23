/**
 * Strategy Pattern implementations for NEXA game
 * 
 * Collision Strategies: Resolve energy packet collisions on edges
 * - OpposingPacketsStrategy: Enemy packets in opposite directions
 * - SameDirectionAlliesStrategy: Ally packets in same direction
 * - OpposingAlliesStrategy: Ally packets in opposite directions
 * - CollisionResolver: Coordinator that selects appropriate strategy
 * 
 * Attack Strategies: Resolve attacks on nodes
 * - NeutralNodeAttackStrategy: Capture neutral nodes
 * - AllyNodeAttackStrategy: Reinforce owned nodes
 * - EnemyNodeAttackStrategy: Conquer enemy nodes
 * - AttackResolver: Coordinator that selects appropriate strategy
 */

export { 
  CollisionResolver,
  OpposingPacketsStrategy,
  SameDirectionAlliesStrategy,
  OpposingAlliesStrategy,
  type ICollisionStrategy,
} from './collision-strategy';

export {
  AttackResolver,
  NeutralNodeAttackStrategy,
  AllyNodeAttackStrategy,
  EnemyNodeAttackStrategy,
  type IAttackStrategy,
} from './attack-strategy';
