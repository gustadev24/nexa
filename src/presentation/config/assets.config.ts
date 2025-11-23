/**
 * Asset Configuration for NEXA Game
 * Defines all assets to be loaded by Phaser Preloader
 */

export interface AssetConfig {
  key: string;
  path: string;
  type: 'image' | 'audio' | 'font' | 'atlas';
}

/**
 * Critical assets loaded in Preloader scene
 */
export const PRELOAD_ASSETS: AssetConfig[] = [
  // Node sprites
  { key: 'node_basic', path: 'assets/images/nodes/node_basic.png', type: 'image' },
  { key: 'node_attack', path: 'assets/images/nodes/node_attack.png', type: 'image' },
  { key: 'node_defense', path: 'assets/images/nodes/node_defense.png', type: 'image' },
  { key: 'node_energy', path: 'assets/images/nodes/node_energy.png', type: 'image' },
  { key: 'node_super_energy', path: 'assets/images/nodes/node_super_energy.png', type: 'image' },

  // Edge visuals
  { key: 'edge_arrow', path: 'assets/images/edges/edge_arrow.png', type: 'image' },
  { key: 'edge_gradient', path: 'assets/images/edges/edge_gradient.png', type: 'image' },

  // Energy packets
  { key: 'packet_energy', path: 'assets/images/packets/packet_energy.png', type: 'image' },
  { key: 'particle_trail', path: 'assets/images/particles/particle_trail.png', type: 'image' },

  // Particles
  { key: 'particle', path: 'assets/images/particles/particle.png', type: 'image' },
  { key: 'particle_spark', path: 'assets/images/particles/particle_spark.png', type: 'image' },

  // UI Elements
  { key: 'ui_button_primary', path: 'assets/images/ui/ui_button_primary.png', type: 'image' },
  { key: 'ui_button_secondary', path: 'assets/images/ui/ui_button_secondary.png', type: 'image' },
  { key: 'ui_panel_info', path: 'assets/images/ui/ui_panel_info.png', type: 'image' },
  { key: 'ui_energy_bar', path: 'assets/images/ui/ui_energy_bar.png', type: 'image' },

  // Icons
  { key: 'icon_energy', path: 'assets/images/ui/icons/icon_energy.png', type: 'image' },
  { key: 'icon_victory', path: 'assets/images/ui/icons/icon_victory.png', type: 'image' },
  { key: 'icon_settings', path: 'assets/images/ui/icons/icon_settings.png', type: 'image' },
  { key: 'icon_pause', path: 'assets/images/ui/icons/icon_pause.png', type: 'image' },
  { key: 'icon_play', path: 'assets/images/ui/icons/icon_play.png', type: 'image' },
];

/**
 * Optional assets loaded lazily during gameplay
 */
export const LAZY_LOAD_ASSETS: AssetConfig[] = [
  // Additional particles
  { key: 'particle_smoke', path: 'assets/images/particles/particle_smoke.png', type: 'image' },

  // Audio - Sound Effects
  { key: 'sfx_node_capture', path: 'assets/audio/sfx/sfx_node_capture.mp3', type: 'audio' },
  { key: 'sfx_energy_send', path: 'assets/audio/sfx/sfx_energy_send.mp3', type: 'audio' },
  { key: 'sfx_energy_arrive', path: 'assets/audio/sfx/sfx_energy_arrive.mp3', type: 'audio' },
  { key: 'sfx_collision', path: 'assets/audio/sfx/sfx_collision.mp3', type: 'audio' },
  { key: 'sfx_node_destroy', path: 'assets/audio/sfx/sfx_node_destroy.mp3', type: 'audio' },
  { key: 'sfx_button_click', path: 'assets/audio/sfx/sfx_button_click.mp3', type: 'audio' },
  { key: 'sfx_button_hover', path: 'assets/audio/sfx/sfx_button_hover.mp3', type: 'audio' },
  { key: 'sfx_select', path: 'assets/audio/sfx/sfx_select.mp3', type: 'audio' },
  { key: 'sfx_victory', path: 'assets/audio/sfx/sfx_victory.mp3', type: 'audio' },
  { key: 'sfx_defeat', path: 'assets/audio/sfx/sfx_defeat.mp3', type: 'audio' },

  // Audio - Music
  { key: 'music_menu', path: 'assets/audio/music/music_menu.mp3', type: 'audio' },
  { key: 'music_game', path: 'assets/audio/music/music_game.mp3', type: 'audio' },
  { key: 'music_victory', path: 'assets/audio/music/music_victory.mp3', type: 'audio' },
];

/**
 * Player colors for runtime texture generation
 */
export const PLAYER_COLORS = {
  player1: 0x0088ff,
  player2: 0xff4444,
  player3: 0x00ff00,
  player4: 0xffaa00,
  neutral: 0x888888,
} as const;

/**
 * Node type colors
 */
export const NODE_TYPE_COLORS = {
  BASIC: 0x888888,
  ATTACK: 0xff4444,
  DEFENSE: 0x4444ff,
  ENERGY: 0xffff00,
  SUPER_ENERGY: 0xffd700,
} as const;

/**
 * UI theme colors
 */
export const UI_COLORS = {
  background: 0x1a1a2e,
  primary: 0x16213e,
  secondary: 0x0f3460,
  success: 0x00ff88,
  danger: 0xff0044,
  warning: 0xffaa00,
  info: 0x0088ff,
} as const;

/**
 * Font configuration
 */
export const FONTS = {
  primary: {
    family: 'Orbitron',
    fallback: "'Arial Black', sans-serif",
    path: 'assets/fonts/Orbitron-Bold.ttf',
  },
  secondary: {
    family: 'Roboto',
    fallback: "'Arial', sans-serif",
    path: 'assets/fonts/Roboto-Regular.ttf',
  },
} as const;

/**
 * Asset loading configuration
 */
export const ASSET_CONFIG = {
  baseURL: '/',
  crossOrigin: 'anonymous',
  timeout: 30000, // 30 seconds
  maxParallelDownloads: 10,
} as const;

/**
 * Placeholder generation settings
 */
export const PLACEHOLDER_SETTINGS = {
  nodeSize: 64,
  iconSize: 32,
  particleSize: 8,
  buttonWidth: 200,
  buttonHeight: 60,
} as const;

/**
 * Helper to get all asset keys
 */
export function getAllAssetKeys(): string[] {
  return [
    ...PRELOAD_ASSETS.map((a) => a.key),
    ...LAZY_LOAD_ASSETS.map((a) => a.key),
  ];
}

/**
 * Helper to get assets by type
 */
export function getAssetsByType(type: AssetConfig['type']): AssetConfig[] {
  return [
    ...PRELOAD_ASSETS.filter((a) => a.type === type),
    ...LAZY_LOAD_ASSETS.filter((a) => a.type === type),
  ];
}

/**
 * Helper to check if asset exists
 */
export function hasAsset(key: string): boolean {
  return getAllAssetKeys().includes(key);
}
