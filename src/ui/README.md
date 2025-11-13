# UI

This directory contains all user interface components, HUD elements, menus, and UI-related logic.

## Purpose

The `ui/` folder is designed to hold:

- **HUD**: Heads-up display elements (health bars, score, minimap)
- **Menus**: Main menu, pause menu, settings menu
- **Dialogs**: Modal dialogs, confirmation boxes, notifications
- **Buttons**: Reusable button components
- **Panels**: Information panels, inventory screens
- **Text Elements**: Styled text components, labels

## Example Structure

```
ui/
├── hud/
│   ├── HealthBar.ts
│   ├── ScoreDisplay.ts
│   └── Minimap.ts
├── menus/
│   ├── PauseMenu.ts
│   ├── SettingsMenu.ts
│   └── InventoryMenu.ts
├── components/
│   ├── Button.ts
│   ├── Panel.ts
│   └── Dialog.ts
├── dialogs/
│   ├── ConfirmDialog.ts
│   └── NotificationDialog.ts
└── base/
    └── UIComponent.ts
```

## Usage

Import UI components using the path alias:

```typescript
import { HealthBar } from '@/ui/hud/HealthBar';
import { PauseMenu } from '@/ui/menus/PauseMenu';
import { Button } from '@/ui/components/Button';
```

## Best Practices

- Create reusable UI components
- Use Phaser.GameObjects.Container for complex UI elements
- Implement proper depth/layer management
- Handle responsive sizing and positioning
- Use events for UI interactions
- Separate UI logic from game logic
- Implement proper cleanup in destroy methods

## Example UI Component

```typescript
import Phaser from 'phaser';

export class HealthBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private maxHealth: number;
  private currentHealth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHealth: number) {
    super(scene, x, y);

    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;

    // Background
    this.background = scene.add.rectangle(0, 0, 200, 20, 0x000000);
    this.background.setOrigin(0, 0.5);

    // Health bar
    this.bar = scene.add.rectangle(0, 0, 200, 20, 0xff0000);
    this.bar.setOrigin(0, 0.5);

    this.add([this.background, this.bar]);
    scene.add.existing(this);

    // Set to fixed camera
    this.setScrollFactor(0);
    this.setDepth(1000);
  }

  setHealth(value: number): void {
    this.currentHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
    const percentage = this.currentHealth / this.maxHealth;
    this.bar.width = 200 * percentage;

    // Change color based on health
    if (percentage > 0.5) {
      this.bar.setFillStyle(0x00ff00); // Green
    } else if (percentage > 0.25) {
      this.bar.setFillStyle(0xffff00); // Yellow
    } else {
      this.bar.setFillStyle(0xff0000); // Red
    }
  }

  getHealth(): number {
    return this.currentHealth;
  }
}
```

## UI Events

Use Phaser's event system for UI interactions:

```typescript
// Emit custom events
this.emit('buttonClicked', buttonData);

// Listen to events
this.on('buttonClicked', (data) => {
  console.log('Button clicked:', data);
});
```

## Styling Guidelines

- Use consistent spacing and alignment
- Define color constants for reusability
- Implement hover and click states for interactive elements
- Consider accessibility (readable fonts, color contrast)
- Use tweens and animations for smooth transitions