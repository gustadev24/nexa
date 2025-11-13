# Assets

This directory contains asset management code, asset references, and asset-related utilities.

## Purpose

The `assets/` folder is designed to hold:

- **Asset Keys**: Centralized constants for asset keys
- **Asset Loaders**: Custom asset loading utilities
- **Asset Managers**: Asset caching and management
- **Sprite Configs**: Sprite sheet and animation configurations
- **Audio Configs**: Audio file references and settings
- **Asset Manifests**: Lists of assets to load per scene

## Example Structure

```
assets/
├── keys/
│   ├── ImageKeys.ts
│   ├── AudioKeys.ts
│   └── SpriteKeys.ts
├── loaders/
│   ├── AssetLoader.ts
│   └── TextureAtlasLoader.ts
├── configs/
│   ├── SpriteConfigs.ts
│   ├── AnimationConfigs.ts
│   └── AudioConfigs.ts
└── manifests/
    ├── MenuAssets.ts
    └── GameAssets.ts
```

## Usage

Import asset utilities using the path alias:

```typescript
import { ImageKeys } from '@/assets/keys/ImageKeys';
import { AudioKeys } from '@/assets/keys/AudioKeys';
import { AssetLoader } from '@/assets/loaders/AssetLoader';
```

## Best Practices

- Centralize all asset keys as constants
- Use TypeScript enums or const objects for type safety
- Document asset sources and licenses
- Organize assets by scene or feature
- Use texture atlases for better performance
- Implement lazy loading for large assets
- Cache frequently used assets

## Example Asset Keys

```typescript
// ImageKeys.ts
export const ImageKeys = {
  PLAYER: 'player',
  ENEMY_FLYING: 'enemy-flying',
  ENEMY_GROUND: 'enemy-ground',
  BACKGROUND: 'background',
  BULLET: 'bullet',
  POWERUP_HEALTH: 'powerup-health',
  POWERUP_SPEED: 'powerup-speed',
} as const;

export type ImageKey = typeof ImageKeys[keyof typeof ImageKeys];
```

```typescript
// AudioKeys.ts
export const AudioKeys = {
  MUSIC_MENU: 'music-menu',
  MUSIC_GAME: 'music-game',
  SFX_SHOOT: 'sfx-shoot',
  SFX_HIT: 'sfx-hit',
  SFX_EXPLOSION: 'sfx-explosion',
  SFX_POWERUP: 'sfx-powerup',
} as const;

export type AudioKey = typeof AudioKeys[keyof typeof AudioKeys];
```

## Example Asset Loader

```typescript
import Phaser from 'phaser';
import { ImageKeys } from '@/assets/keys/ImageKeys';
import { AudioKeys } from '@/assets/keys/AudioKeys';

export class AssetLoader {
  static loadGameAssets(scene: Phaser.Scene): void {
    // Images
    scene.load.image(ImageKeys.PLAYER, 'assets/sprites/player.png');
    scene.load.image(ImageKeys.ENEMY_FLYING, 'assets/sprites/enemy-flying.png');
    scene.load.image(ImageKeys.BACKGROUND, 'assets/backgrounds/game-bg.png');

    // Sprite sheets
    scene.load.spritesheet(ImageKeys.BULLET, 'assets/sprites/bullet.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Audio
    scene.load.audio(AudioKeys.MUSIC_GAME, 'assets/audio/music/game-theme.mp3');
    scene.load.audio(AudioKeys.SFX_SHOOT, 'assets/audio/sfx/shoot.wav');
    scene.load.audio(AudioKeys.SFX_HIT, 'assets/audio/sfx/hit.wav');

    // Texture Atlas
    scene.load.atlas(
      'game-atlas',
      'assets/atlases/game-atlas.png',
      'assets/atlases/game-atlas.json'
    );
  }

  static loadMenuAssets(scene: Phaser.Scene): void {
    scene.load.image(ImageKeys.BACKGROUND, 'assets/backgrounds/menu-bg.png');
    scene.load.audio(AudioKeys.MUSIC_MENU, 'assets/audio/music/menu-theme.mp3');
  }
}
```

## Example Animation Config

```typescript
import { ImageKeys } from '@/assets/keys/ImageKeys';

export const AnimationConfigs = {
  PLAYER_IDLE: {
    key: 'player-idle',
    frames: { key: ImageKeys.PLAYER, start: 0, end: 3 },
    frameRate: 8,
    repeat: -1,
  },
  PLAYER_RUN: {
    key: 'player-run',
    frames: { key: ImageKeys.PLAYER, start: 4, end: 9 },
    frameRate: 12,
    repeat: -1,
  },
  EXPLOSION: {
    key: 'explosion',
    frames: { key: 'game-atlas', prefix: 'explosion-', start: 0, end: 7 },
    frameRate: 20,
    repeat: 0,
  },
} as const;
```

## Asset Organization

Physical assets should be stored in `public/assets/`:

```
public/assets/
├── sprites/
│   ├── player.png
│   ├── enemies/
│   └── items/
├── backgrounds/
│   ├── menu-bg.png
│   └── game-bg.png
├── audio/
│   ├── music/
│   │   ├── menu-theme.mp3
│   │   └── game-theme.mp3
│   └── sfx/
│       ├── shoot.wav
│       └── hit.wav
├── fonts/
│   └── game-font.ttf
└── atlases/
    ├── game-atlas.png
    └── game-atlas.json
```

## Performance Tips

- Use texture atlases to reduce draw calls
- Compress audio files appropriately (MP3 for music, OGG/WAV for SFX)
- Optimize image sizes and use appropriate formats (PNG for transparency, JPG for photos)
- Load assets per scene to reduce initial load time
- Use asset preloading for smoother transitions
- Implement loading screens for better UX