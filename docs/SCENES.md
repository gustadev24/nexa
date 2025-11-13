# NEXA - Scenes Documentation

This document describes the game's scene architecture and implementation.

## 🎬 Scene Flow

```
┌──────────┐
│   Boot   │
└────┬─────┘
     │
     ▼
┌──────────┐     ┌──────────┐
│ MainMenu │────▶│   Game   │
└──────────┘     └────┬─────┘
     ▲                │
     └────────────────┘
```

## 📦 Scene List

### 1. Boot Scene
**File**: `src/scenes/Boot.ts`  
**Purpose**: Initialize the game and prepare for menu display  
**Key**: `"Boot"`

**Features**:
- Minimal loading (no assets required)
- Quick initialization
- Immediate transition to MainMenu
- Console logging for debugging

**Lifecycle**:
```typescript
preload() → create() → transition to MainMenu
```

---

### 2. MainMenu Scene
**File**: `src/scenes/MainMenu.ts`  
**Purpose**: Display main menu with futuristic design  
**Key**: `"MainMenu"`

**Features**:
- **Futuristic Background**: Dark gradient with animated accents
- **Animated Grid**: Subtle cyan grid overlay with pulse effect
- **Title Display**: "NEXA" with glowing cyan text
- **Subtitle**: "Nexus Expansion Algorithm" with letter spacing
- **Interactive Play Button**: Hover effects and click animations
- **Version Info**: Bottom-right corner display

**Visual Design**:
- Background: `#001122` (dark blue-black)
- Primary Color: `#00FFFF` (cyan)
- Accent Color: `#0088AA` (darker cyan)
- Font: Arial Black for titles, Arial for body

**Animations**:
1. **Entrance Animation**:
   - Title fades in (1000ms)
   - Subtitle fades in (1000ms, 300ms delay)
   - Play button slides in (800ms, 600ms delay)

2. **Button Animations**:
   - Idle: Subtle pulse (1.05 scale, 1500ms cycle)
   - Hover: Glow effect, scale 1.1, fill opacity 0.2
   - Click: Press effect (0.95 scale), camera flash

3. **Background Effects**:
   - Accent bars pulse (2000ms cycle)
   - Grid fades (3000ms cycle)

**User Interactions**:
- Click "PLAY" button → Fade to Game scene
- Camera flash effect on transition
- Smooth fade out (500ms)

---

### 3. Game Scene
**File**: `src/scenes/Game.ts`  
**Purpose**: Main gameplay scene  
**Key**: `"Game"`

**Features**:
- **Space-like Background**: Dark background with gradient layers
- **Animated Stars**: 50 randomly placed twinkling "stars"
- **Grid Overlay**: 80px spacing with cyan lines
- **HUD Elements**: Top and bottom bars with game info
- **Fade-in Transition**: Smooth entrance from menu

**Visual Design**:
- Background: `#001122` (matches menu)
- Grid Color: `#00FFFF` with 0.15 alpha
- HUD Background: `#001A33` with 0.8 alpha
- Grid Spacing: 80px

**HUD Components**:

**Top Bar** (60px height):
- Left: "NEXA" logo text
- Right: Stats display (Energy, Nodes)
- Z-index: 100-101

**Bottom Bar** (50px height):
- Center: Instructions/status text
- Z-index: 100-101

**Background Layers**:
1. Base color (`#001122`)
2. Three gradient rectangles (0.2-0.3 alpha)
3. 50 animated star particles
4. Grid overlay

**Animations**:
1. **Stars**: Individual twinkle (1000-3000ms random)
2. **Grid**: Pulse effect (2000ms cycle)
3. **Camera**: Fade-in on entry (500ms)

**Temporary Features** (for testing):
- Click anywhere to return to menu
- Center info text with instructions
- Placeholder stats in HUD

**Future Implementation Areas**:
```typescript
update(_time: number, _delta: number) {
  // Game loop logic will go here:
  // - Node energy generation
  // - Connection updates
  // - AI decision making
  // - Victory condition checks
  // - Input handling
}
```

---

## 🎨 Design System

### Color Palette

```
Dark Background:  #001122  (Primary background)
Dark Accent:      #001A33  (HUD background)
Medium Dark:      #002244  (Gradient accents)
Primary Cyan:     #00FFFF  (Main UI color)
Dark Cyan:        #0088AA  (Strokes, secondary)
Muted Cyan:       #00AAAA  (Text, less emphasis)
Very Dark Cyan:   #006666  (Subtle text)
```

### Typography

**Fonts**:
- **Headings**: Arial Black, sans-serif
- **Body**: Arial, sans-serif

**Sizes**:
- Title: 96px (main title)
- Subtitle: 24px
- Button: 32px
- HUD: 18-24px
- Small text: 16px

**Effects**:
- Letter spacing: 2-4px (titles)
- Stroke: 4px for emphasis
- Glow: 0.1-0.3 alpha rectangles

### Animation Durations

```
Fast:    100-300ms  (Button press, quick feedback)
Normal:  500-800ms  (Transitions, slides)
Slow:    1000ms+    (Fades, entrance animations)
Idle:    1500-3000ms (Pulse effects, ambience)
```

### Easing Functions

- **Power2**: Sharp animations (fades)
- **Sine.easeInOut**: Smooth loops (pulses)
- **Back.easeOut**: Bouncy entrance (buttons)

---

## 🔧 Technical Details

### Scene Configuration

```typescript
// In src/game/main.ts
scene: [Boot, MainMenu, Game]
```

**Load Order**:
1. Boot (initializes)
2. MainMenu (auto-started by Boot)
3. Game (started by menu button)

### Camera Settings

```typescript
// Default viewport
width: 1024
height: 768

// Scale mode
Phaser.Scale.FIT
Phaser.Scale.CENTER_BOTH
```

### Physics Configuration

```typescript
physics: {
  default: "arcade",
  arcade: {
    gravity: { x: 0, y: 0 },  // No gravity (top-down)
    debug: false
  }
}
```

---

## 📝 Scene Transitions

### Boot → MainMenu

```typescript
// In Boot.create()
this.scene.start("MainMenu");
```

- Immediate transition
- No animation
- Console log for debugging

### MainMenu → Game

```typescript
// On Play button click
this.cameras.main.fadeOut(500, 0, 17