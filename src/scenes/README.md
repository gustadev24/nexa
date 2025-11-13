# Scenes

This directory contains all Phaser game scenes that make up the different states and screens of your game.

## Purpose

The `scenes/` folder is designed to hold:

- **Boot Scene**: Initial scene for loading critical assets
- **Preloader Scene**: Main asset loading with progress indication
- **Menu Scenes**: Main menu, settings, credits
- **Game Scenes**: Actual gameplay scenes
- **UI Scenes**: Overlay scenes for HUD and menus
- **Transition Scenes**: Scene transitions and cutscenes

## Current Structure

```
scenes/
├── Boot.ts          - Initial boot scene
├── Preloader.ts     - Asset loading scene
├── MainMenu.ts      - Main menu scene
├── Game.ts          - Main gameplay scene
└── GameOver.ts      - Game over scene
```

## Usage

Import scenes using the path alias:

```typescript
import { Boot } from '@/scenes/Boot';
import { MainMenu } from '@/scenes/MainMenu';
import { Game } from '@/scenes/Game';
```

Scenes are registered in `src/game/main.ts`:

```typescript
const config: Phaser.Types.Core.GameConfig = {
  // ... other config
  scene: [
    Boot,
    Preloader,
    MainMenu,
    Game,
    GameOver
  ]
};
```

## Scene Lifecycle

Phaser scenes follow this lifecycle:

1. **init()** - Initialize scene data
2. **preload()** - Load scene-specific assets
3. **create()** - Set up game objects and logic
4. **update()** - Called every frame during scene runtime

```typescript
import { Scene } from 'phaser';

export class ExampleScene extends Scene {
  constructor() {
    super('ExampleScene');
  }

  init(data: any): void {
    // Initialize with data passed from previous scene
  }

  preload(): void {
    // Load assets specific to this scene
  }

  create(): void {
    // Create game objects and set up logic
  }

  update(time: number, delta: number): void {
    // Update logic called every frame
  }
}
```

## Scene Transitions

### Starting a Scene

```typescript
// Start a scene (stops current scene)
this.scene.start('NextScene', { score: 100 });

// Launch a scene (runs parallel to current scene)
this.scene.launch('HUDScene');

// Pause current scene and start another
this.scene.pause();
this.scene.launch('PauseMenu');
```

### Resuming Scenes

```typescript
// Resume a paused scene
this.scene.resume('GameScene');

// Stop a running scene
this.scene.stop('PauseMenu');
```

## Best Practices

- Keep scenes focused on a single responsibility
- Use `init()` to receive data from previous scenes
- Clean up resources in `shutdown()` or scene stop events
- Use scene data for passing information between scenes
- Implement proper scene transitions for better UX
- Consider using parallel scenes for HUD/UI overlays
- Separate game logic from scene management

## Example Game Scene

```typescript
import { Scene } from 'phaser';
import { Player } from '@/entities/player/Player';
import { HealthBar } from '@/ui/hud/HealthBar';
import { ImageKeys } from '@/assets/keys/ImageKeys';

export class GameScene extends Scene {
  private player!: Player;
  private healthBar!: HealthBar;
  private score: number = 0;

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number }): void {
    this.score = 0;
    console.log('Starting level:', data.level || 1);
  }

  preload(): void {
    // Load scene-specific assets if needed
  }

  create(): void {
    // Background
    this.add.image(512, 384, ImageKeys.BACKGROUND);

    // Create player
    this.player = new Player(this, 100, 100);

    // Create UI
    this.healthBar = new HealthBar(this, 10, 10, 100);

    // Setup input
    this.setupInput();

    // Setup collisions
    this.setupCollisions();
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    
    // Check game over condition
    if (this.player.health <= 0) {
      this.gameOver();
    }
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseMenu');
    });
  }

  private setupCollisions(): void {
    // Setup physics collisions here
  }

  private gameOver(): void {
    this.scene.start('GameOver', { score: this.score });
  }

  private addScore(points: number): void {
    this.score += points;
  }
}
```

## Scene Communication

### Using Events

```typescript
// In Scene A - emit event
this.events.emit('playerDied', { score: 100 });

// In Scene B - listen to Scene A events
const sceneA = this.scene.get('SceneA');
sceneA.events.on('playerDied', (data) => {
  console.log('Player died with score:', data.score);
});
```

### Using Scene Data

```typescript
// Set data in scene
this.scene.get('GameScene').data.set('score', 100);

// Get data from scene
const score = this.scene.get('GameScene').data.get('score');
```

## Scene Registry

Access global data across all scenes:

```typescript
// Set global data
this.registry.set('highScore', 1000);

// Get global data
const highScore = this.registry.get('highScore');

// Listen to registry changes
this.registry.events.on('changedata-highScore', (parent, value) => {
  console.log('High score updated:', value);
});
```

## Tips

- Use the Boot scene for minimal, critical loading only
- Show loading progress in the Preloader scene
- Implement proper cleanup to avoid memory leaks
- Use TypeScript for better type safety and autocomplete
- Consider using scene plugins for shared functionality
- Test scene transitions thoroughly
- Profile scene performance with Phaser debug tools