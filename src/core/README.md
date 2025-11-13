# Core

This directory contains core game logic, utilities, and services that are shared across the application.

## Purpose

The `core/` folder is designed to hold:

- **Game Configuration**: Central configuration files and constants
- **Utilities**: Helper functions and utility classes
- **Services**: Game services (audio manager, input manager, etc.)
- **Base Classes**: Abstract classes and interfaces
- **Game State**: Global state management

## Example Structure

```
core/
├── config/
│   ├── GameConfig.ts
│   └── Constants.ts
├── managers/
│   ├── AudioManager.ts
│   ├── SaveManager.ts
│   └── InputManager.ts
├── utils/
│   ├── MathUtils.ts
│   └── ArrayUtils.ts
└── types/
    └── GameTypes.ts
```

## Usage

Import core modules using the path alias:

```typescript
import { GameConfig } from '@/core/config/GameConfig';
import { AudioManager } from '@/core/managers/AudioManager';
import { clamp } from '@/core/utils/MathUtils';
```

## Best Practices

- Keep utilities pure and reusable
- Avoid circular dependencies
- Document public APIs
- Use TypeScript types/interfaces for better type safety