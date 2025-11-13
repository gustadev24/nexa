# Entities

This directory contains all game entities such as players, enemies, items, and other interactive game objects.

## Purpose

The `entities/` folder is designed to hold:

- **Player**: Player character classes and logic
- **Enemies**: Enemy types and AI behaviors
- **Items**: Collectible items, power-ups, weapons
- **NPCs**: Non-player characters
- **Projectiles**: Bullets, missiles, and other projectiles
- **Props**: Interactive environment objects

## Example Structure

```
entities/
├── player/
│   ├── Player.ts
│   └── PlayerController.ts
├── enemies/
│   ├── BaseEnemy.ts
│   ├── FlyingEnemy.ts
│   └── GroundEnemy.ts
├── items/
│   ├── Collectible.ts
│   ├── PowerUp.ts
│   └── Weapon.ts
├── projectiles/
│   ├── Bullet.ts
│   └── Missile.ts
└── base/
    └── Entity.ts
```

## Usage

Import entities using the path alias:

```typescript
import { Player } from '@/entities/player/Player';
import { FlyingEnemy } from '@/entities/enemies/FlyingEnemy';
import { PowerUp } from '@/entities/items/PowerUp';
```

## Best Practices

- Extend from Phaser.GameObjects.Sprite or Phaser.Physics.Arcade.Sprite
- Create a base Entity class for shared functionality
- Implement component-based architecture for reusability
- Keep entity logic self-contained
- Use TypeScript interfaces for entity properties
- Separate rendering from logic when possible

## Example Entity

```typescript
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private health: number;
  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    
    this.health = 100;
    this.speed = 200;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  update(time: number, delta: number): void {
    // Update logic here
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
}
```
