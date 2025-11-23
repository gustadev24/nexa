# NEXA - Asset Specification

Este documento define todos los assets necesarios para el juego NEXA. Todos los assets son **placeholders** que pueden ser reemplazados con arte final posteriormente.

## 📁 Estructura de Assets

```
public/assets/
├── images/
│   ├── nodes/          # Sprites de nodos
│   ├── ui/             # Elementos de interfaz
│   └── particles/      # Texturas de partículas
├── audio/              # Efectos de sonido y música
└── fonts/              # Fuentes personalizadas
```

## 🎨 Node Sprites

### Dimensiones
- **Tamaño base**: 64x64 px
- **Formato**: PNG con transparencia
- **Resolución**: @1x, @2x para pantallas retina

### Tipos de Nodos

#### 1. Basic Node (`node_basic.png`)
- **Color base**: Gris (#888888)
- **Diseño**: Círculo simple con borde
- **Variantes**: neutral, player1, player2, player3, player4

#### 2. Attack Node (`node_attack.png`)
- **Color base**: Rojo (#FF4444)
- **Diseño**: Círculo con icono de espada/flecha
- **Características visuales**: Bordes puntiagudos, efecto agresivo

#### 3. Defense Node (`node_defense.png`)
- **Color base**: Azul (#4444FF)
- **Diseño**: Círculo con icono de escudo
- **Características visuales**: Bordes sólidos, aspecto protector

#### 4. Energy Node (`node_energy.png`)
- **Color base**: Amarillo (#FFFF00)
- **Diseño**: Círculo con icono de batería/rayo
- **Características visuales**: Glow brillante, aspecto energético

#### 5. Super Energy Node (`node_super_energy.png`)
- **Color base**: Dorado (#FFD700)
- **Diseño**: Círculo con doble icono de rayo
- **Características visuales**: Glow intenso, partículas animadas

### Estados de Nodos
Cada tipo debe tener variantes para:
- **Normal**: Estado por defecto
- **Hover**: Resaltado cuando el mouse está encima
- **Selected**: Cuando está seleccionado
- **Initial**: Marcador especial para nodo inicial (★)

## 🔗 Edge Visuals

### Arrow Sprite (`edge_arrow.png`)
- **Tamaño**: 16x16 px
- **Diseño**: Flecha simple direccional
- **Colores**: Variantes para cada jugador + neutral

### Gradient Texture (`edge_gradient.png`)
- **Tamaño**: 4x64 px
- **Uso**: Textura para líneas con gradiente
- **Transparencia**: Alpha gradient de 0 a 1

## ⚡ Energy Packet Sprites

### Basic Packet (`packet_energy.png`)
- **Tamaño**: 16x16 px
- **Diseño**: Esfera brillante
- **Variantes de color**: player1, player2, player3, player4

### Particle Trail (`particle_trail.png`)
- **Tamaño**: 8x8 px
- **Diseño**: Pequeña esfera difusa
- **Uso**: Trail effect para paquetes en movimiento

## 🎭 Particle Textures

### Basic Particle (`particle.png`)
- **Tamaño**: 8x8 px
- **Diseño**: Círculo simple con alpha gradient
- **Uso**: Explosiones, efectos de captura

### Spark Particle (`particle_spark.png`)
- **Tamaño**: 16x16 px
- **Diseño**: Estrella de 4 puntas
- **Uso**: Efectos de colisión, victorias

### Smoke Particle (`particle_smoke.png`)
- **Tamaño**: 32x32 px
- **Diseño**: Nube difusa
- **Uso**: Efectos de destrucción

## 🎮 UI Elements

### Buttons

#### Primary Button (`ui_button_primary.png`)
- **Tamaño**: 200x60 px (9-slice compatible)
- **Estados**: normal, hover, pressed, disabled

#### Secondary Button (`ui_button_secondary.png`)
- **Tamaño**: 200x60 px (9-slice compatible)
- **Estados**: normal, hover, pressed, disabled

### Panels

#### Info Panel (`ui_panel_info.png`)
- **Tamaño**: 400x300 px (9-slice compatible)
- **Uso**: Mostrar información de nodos/jugadores

#### Energy Bar (`ui_energy_bar.png`)
- **Tamaño**: 200x30 px
- **Diseño**: Barra de progreso con contenedor y relleno

### Icons

#### Energy Icon (`icon_energy.png`)
- **Tamaño**: 32x32 px
- **Diseño**: Rayo estilizado

#### Victory Icon (`icon_victory.png`)
- **Tamaño**: 64x64 px
- **Diseño**: Trofeo/corona

#### Settings Icon (`icon_settings.png`)
- **Tamaño**: 32x32 px
- **Diseño**: Engranaje

#### Pause Icon (`icon_pause.png`)
- **Tamaño**: 32x32 px
- **Diseño**: Dos barras verticales

#### Play Icon (`icon_play.png`)
- **Tamaño**: 32x32 px
- **Diseño**: Triángulo hacia la derecha

## 🎵 Audio Assets (Opcional)

### Sound Effects

#### Gameplay
- `sfx_node_capture.mp3` - Sonido de captura de nodo
- `sfx_energy_send.mp3` - Envío de paquete de energía
- `sfx_energy_arrive.mp3` - Llegada de paquete
- `sfx_collision.mp3` - Colisión entre paquetes
- `sfx_node_destroy.mp3` - Destrucción de nodo

#### UI
- `sfx_button_click.mp3` - Click en botón
- `sfx_button_hover.mp3` - Hover sobre botón
- `sfx_select.mp3` - Selección de nodo

#### Game States
- `sfx_victory.mp3` - Sonido de victoria
- `sfx_defeat.mp3` - Sonido de derrota

### Music
- `music_menu.mp3` - Música del menú principal
- `music_game.mp3` - Música durante el juego
- `music_victory.mp3` - Música de victoria

## 🔤 Fonts

### Primary Font
- **Nombre**: `Orbitron-Bold.ttf`
- **Uso**: Títulos, números de energía
- **Estilo**: Futurista, bold
- **Fallback**: 'Arial Black', sans-serif

### Secondary Font
- **Nombre**: `Roboto-Regular.ttf`
- **Uso**: Texto general de UI
- **Estilo**: Clean, readable
- **Fallback**: 'Arial', sans-serif

## 📐 Especificaciones Técnicas

### Formatos de Archivo
- **Imágenes**: PNG-24 con alpha channel
- **Audio**: MP3 (128kbps) o OGG Vorbis
- **Fuentes**: TTF o WOFF2

### Optimización
- Todas las imágenes deben estar optimizadas con herramientas como TinyPNG
- Usar sprite atlases para reducir draw calls
- Audio comprimido pero con calidad suficiente

### Naming Convention
```
{type}_{name}_{variant}.{ext}

Ejemplos:
- node_basic_player1.png
- ui_button_primary_hover.png
- sfx_node_capture.mp3
```

## 🎨 Color Palette

### Players
- **Player 1**: #0088FF (Blue)
- **Player 2**: #FF4444 (Red)
- **Player 3**: #00FF00 (Green)
- **Player 4**: #FFAA00 (Orange)

### Neutrals
- **Neutral Node**: #888888 (Gray)
- **Background**: #1a1a2e (Dark Blue)
- **UI Primary**: #16213e (Navy)
- **UI Secondary**: #0f3460 (Deep Blue)

### Accents
- **Energy**: #FFFF00 (Yellow)
- **Super Energy**: #FFD700 (Gold)
- **Success**: #00FF88 (Bright Green)
- **Danger**: #FF0044 (Bright Red)

## 📦 Asset Loading Priority

### Preload (Scene: Preloader)
1. **Critical UI**: Botones, paneles básicos
2. **Node sprites**: Todos los tipos
3. **Particle textures**: Básicas
4. **Primary font**

### Lazy Load (Durante el juego)
1. **Audio assets**: Música y SFX
2. **Advanced particles**: Smoke, sparks
3. **Secondary font**

## 🔄 Placeholder Generation

Para desarrollo rápido, se pueden generar placeholders usando:

### Canvas API (JavaScript)
```javascript
// Generar círculo simple para nodos
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = color;
ctx.arc(32, 32, 28, 0, Math.PI * 2);
ctx.fill();
```

### Phaser Graphics
```typescript
// Generar texturas en runtime
const graphics = scene.make.graphics();
graphics.fillStyle(0xFF0000);
graphics.fillCircle(32, 32, 28);
graphics.generateTexture('node_basic', 64, 64);
```

## 📊 Asset Checklist

- [ ] Node sprites (5 tipos x 5 variantes = 25 archivos)
- [ ] Edge visuals (2 archivos)
- [ ] Energy packet sprites (5 archivos)
- [ ] Particle textures (3 archivos)
- [ ] UI buttons (2 tipos x 4 estados = 8 archivos)
- [ ] UI panels (2 archivos)
- [ ] UI icons (5 archivos)
- [ ] Audio SFX (9 archivos) - Opcional
- [ ] Music tracks (3 archivos) - Opcional
- [ ] Fonts (2 archivos)

**Total mínimo**: ~50 archivos de imagen + 2 fuentes
**Total completo**: ~50 imágenes + 12 audio + 2 fuentes = 64 archivos

## 🎯 Notas de Implementación

1. **Phaser 3 Asset Loading**: Usar `scene.load.image()`, `scene.load.audio()`, etc.
2. **Texture Atlas**: Considerar agrupar sprites pequeños en atlas para mejor performance
3. **Responsive**: Preparar assets @1x, @2x para diferentes resoluciones
4. **WebGL Compatibility**: Asegurar que todas las texturas tengan dimensiones potencia de 2 cuando sea posible
5. **Fallbacks**: Tener placeholders generados programáticamente como fallback

---

**Fecha de creación**: 2025
**Versión**: 1.0
**Proyecto**: NEXA - RTS en Grafos
