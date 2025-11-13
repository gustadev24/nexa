# NEXA - Getting Started Guide

Quick guide to get NEXA up and running on your local machine.

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16 or higher
- **pnpm** (recommended) or npm

### Installation

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd nexa

# Install dependencies with pnpm
pnpm install

# Or with npm
npm install
```

### Running the Game

#### Development Mode

```bash
# With logging
pnpm run dev

# Without logging
pnpm run dev-nolog
```

The game will be available at: **http://localhost:8080**

#### Production Build

```bash
# Build the game
pnpm run build

# Or without logging
pnpm run build-nolog
```

Built files will be in the `dist/` folder.

## 🎮 What to Expect

### Scene Flow

```
Boot Scene (instant)
    ↓
Main Menu (interactive)
    ↓ [Click PLAY]
Game Scene (gameplay area)
    ↓ [Click anywhere - temporary]
Back to Main Menu
```

### Main Menu Features

**Visual Elements**:
- Dark futuristic background (#001122)
- Animated cyan grid overlay
- Glowing "NEXA" title (96px, cyan)
- "Nexus Expansion Algorithm" subtitle
- Interactive "PLAY" button with hover effects

**Animations**:
- Title fades in
- Grid pulses gently
- Button has idle pulse effect
- Hover creates glow effect
- Click triggers camera flash

### Game Scene Features

**Visual Elements**:
- Space-like dark background
- 50 twinkling stars
- 80px grid overlay with cyan lines
- Top HUD bar with "NEXA" logo and stats
- Bottom HUD bar with instructions
- Center info text (temporary)

**Current Functionality**:
- Click anywhere to return to menu (temporary)
- Smooth camera fade transitions
- Animated background effects

## 🎨 Design Preview

### Color Scheme

```
Background Colors:
  █ #001122 - Primary dark background
  █ #001A33 - HUD background
  █ #002244 - Gradient accents

UI Colors:
  █ #00FFFF - Primary cyan (buttons, text, grid)
  █ #0088AA - Dark cyan (strokes, secondary)
  █ #00AAAA - Muted cyan (body text)
  █ #006666 - Very dark cyan (subtle text)
```

### Typography

```
Titles:    Arial Black, 96px, #00FFFF
Subtitles: Arial, 24px, letter-spacing: 4px
Buttons:   Arial Black, 32px, letter-spacing: 2px
HUD:       Arial, 18-24px
```

## 🔧 Development

### Project Structure

```
nexa/
├── src/
│   ├── scenes/
│   │   ├── Boot.ts       # Initial scene
│   │   ├── MainMenu.ts   # Main menu
│   │   └── Game.ts       # Game scene
│   ├── core/
│   │   └── types/        # TypeScript interfaces
│   ├── entities/         # Game entities (future)
│   ├── ui/               # UI components (future)
│   └── game/
│       └── main.ts       # Game configuration
├── docs/
│   ├── SCENES.md         # Scene documentation
│   ├── TYPE_SYSTEM.md    # Type system guide
│   └── GETTING_STARTED.md # This file
└── public/
    └── assets/           # Game assets (future)
```

### Key Files

**Game Entry Point**:
- `src/main.ts` - Application bootstrap
- `src/game/main.ts` - Phaser game configuration

**Scenes**:
- `src/scenes/Boot.ts` - Initialization
- `src/scenes/MainMenu.ts` - Main menu
- `src/scenes/Game.ts` - Gameplay

**Types**:
- `src/core/types/` - All TypeScript interfaces

### Path Aliases

The project uses path aliases for clean imports:

```typescript
import { INode, IPlayer } from '@/core/types';
import { Boot } from '@/scenes/Boot';
```

Available aliases:
- `@/*` → `src/*`
- `@/scenes/*` → `src/scenes/*`
- `@/entities/*` → `src/entities/*`
- `@/core/*` → `src/core/*`
- `@/ui/*` → `src/ui/*`
- `@/assets/*` → `src/assets/*`

## 📖 Documentation

- **[Scenes Documentation](./SCENES.md)** - Scene architecture and features
- **[Type System](./TYPE_SYSTEM.md)** - Complete type system overview
- **[Core Types README](../src/core/types/README.md)** - Interface documentation

## 🎯 Current Status

### ✅ Completed

- [x] Project structure with folders
- [x] Path aliases configuration
- [x] Complete type system (39 interfaces, 10 enums)
- [x] Boot scene (minimal loading)
- [x] MainMenu scene (futuristic UI)
- [x] Game scene (base canvas)
- [x] Camera transitions
- [x] Programmatic graphics (no assets needed)

### 🚧 In Progress / Next Steps

- [ ] Node entity implementation
- [ ] Connection system
- [ ] Player management
- [ ] Game state manager
- [ ] AI system
- [ ] Input handling
- [ ] Game mechanics (expand, attack, transfer)
- [ ] Victory conditions
- [ ] Sound effects and music

## 🐛 Troubleshooting

### TypeScript Errors

If you see TypeScript errors, try:

```bash
# Restart TypeScript server in VSCode
Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Clear build cache
rm -rf dist node_modules/.vite
pnpm install
```

### Path Aliases Not Working

1. Check `tsconfig.json` has correct paths
2. Check `vite/config.dev.mjs` has resolve.alias
3. Restart dev server

### Build Fails

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml dist
pnpm install
pnpm run build-nolog
```

## 💡 Tips

### Hot Reload

The dev server supports hot reload. Edit any file in `src/` and see changes instantly.

### Console Logging

Check browser console for scene transition logs:
```
[NEXA] Boot Scene: Initializing...
[NEXA] Boot Scene: Complete
[NEXA] Starting game...
[NEXA] Game Scene: Ready
```

### Performance

- Grid animations are optimized with tweens
- Star particles use low alpha for performance
- Camera transitions use hardware acceleration

## 🎮 Controls (Current)

**Main Menu**:
- Click "PLAY" button → Start game

**Game Scene** (temporary):
- Click anywhere → Return to menu

## 📦 Tech Stack

- **Phaser 3.90.0** - Game framework
- **TypeScript 5.7.2** - Type safety
- **Vite 6.3.1** - Build tool
- **pnpm** - Package manager

## 📝 Notes

### No Assets Required

Current implementation uses only programmatic graphics:
- Rectangles for backgrounds
- Text objects for UI
- Graphics for grids
- Circles for stars

This allows rapid prototyping without asset dependencies.

### Future Assets

When assets are added, place them in `public/assets/`:
```
public/assets/
├── sprites/
├── audio/
└── fonts/
```

## 🤝 Contributing

When adding features:

1. Follow the existing scene structure
2. Use TypeScript interfaces from `@/core/types`
3. Document new scenes in `docs/SCENES.md`
4. Follow conventional commits format
5. Test build before committing

## 📊 Statistics

**Current Codebase**:
- Type system: 1,412 lines
- Scenes: ~700 lines
- Total interfaces: 39
- Total enums: 10
- Documentation: 3 guides

---

**Ready to play?** Run `pnpm run dev` and open http://localhost:8080

**Need help?** Check the documentation in `docs/` folder

**Happy coding! 🚀**