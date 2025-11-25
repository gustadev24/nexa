/**
 * GAME_CONSTANTS - Constantes globales del juego NEXA
 *
 * Centraliza todos los valores numéricos y configuraciones
 * que definen el comportamiento del juego
 */
export const GAME_CONSTANTS = {
  // ============================================
  // ENERGÍA INICIAL Y VELOCIDAD
  // ============================================
  /** Energía inicial que recibe cada jugador al comenzar */
  INITIAL_ENERGY: 100,

  /** Velocidad de movimiento de los paquetes de energía (unidades/segundo) */
  ENERGY_SPEED: 100,

  // ============================================
  // INTERVALOS DE ATAQUE Y DEFENSA
  // ============================================
  /** Intervalo base de ataque para nodos básicos (ms) */
  ATTACK_INTERVAL: 1000,

  /** Intervalo base de defensa para nodos básicos (ms) */
  DEFENSE_INTERVAL: 1000,

  /** Intervalo de ataque para nodos SuperEnergy (ms) */
  SUPER_ENERGY_ATTACK_INTERVAL: 500,

  // ============================================
  // CONDICIONES DE VICTORIA
  // ============================================
  /** Porcentaje de nodos requerido para victoria por dominancia (0.7 = 70%) */
  DOMINANCE_THRESHOLD: 0.7,

  /** Duración de dominancia requerida para ganar (ms) */
  DOMINANCE_DURATION: 10000, // 10 segundos

  /** Tiempo límite de la partida (ms) */
  GAME_TIME_LIMIT: 180000, // 3 minutos

  // ============================================
  // MULTIPLICADORES DE ATAQUE Y DEFENSA
  // ============================================
  /** Multiplicador de ataque por defecto */
  DEFAULT_ATTACK_MULTIPLIER: 1.0,

  /** Multiplicador de defensa por defecto */
  DEFAULT_DEFENSE_MULTIPLIER: 1.0,

  /** Multiplicador de ataque para SuperEnergyNode */
  SUPER_ENERGY_ATTACK_MULTIPLIER: 2.0,

  /** Multiplicador de defensa para ArticulationNode */
  ARTICULATION_DEFENSE_MULTIPLIER: 1.5,

  // ============================================
  // RENDERIZADO Y UI
  // ============================================
  /** Radio de los nodos en píxeles */
  NODE_RADIUS: 30,

  /** Radio de los paquetes de energía en píxeles */
  PACKET_RADIUS: 8,

  /** Ancho de las aristas en píxeles */
  EDGE_WIDTH: 4,

  /** Ancho de las aristas cuando están seleccionadas */
  EDGE_WIDTH_SELECTED: 6,

  /** Opacidad de los nodos neutrales (0-1) */
  NEUTRAL_NODE_OPACITY: 0.5,

  /** Opacidad de los nodos controlados (0-1) */
  CONTROLLED_NODE_OPACITY: 1.0,

  // ============================================
  // COLORES
  // ============================================
  /** Color para nodos neutrales */
  NEUTRAL_COLOR: '#888888',

  /** Color para aristas */
  EDGE_COLOR: '#444444',

  /** Color para aristas seleccionadas */
  EDGE_SELECTED_COLOR: '#FFFF00',

  /** Color de fondo del canvas */
  BACKGROUND_COLOR: '#001122',

  // ============================================
  // FÍSICA Y COLISIONES
  // ============================================
  /** Umbral de distancia para detectar colisiones entre paquetes */
  COLLISION_THRESHOLD: 0.01,

  /** Velocidad mínima de un paquete (unidades/segundo) */
  MIN_PACKET_SPEED: 50,

  /** Velocidad máxima de un paquete (unidades/segundo) */
  MAX_PACKET_SPEED: 200,

  // ============================================
  // LÍMITES Y VALIDACIONES
  // ============================================
  /** Mínimo de jugadores para comenzar una partida */
  MIN_PLAYERS: 2,

  /** Máximo de jugadores permitidos */
  MAX_PLAYERS: 4,

  /** Mínimo de nodos básicos neutrales requeridos */
  MIN_NEUTRAL_NODES: 2,

  /** Energía mínima que puede tener un nodo */
  MIN_NODE_ENERGY: 0,

  /** Energía mínima que puede tener un paquete */
  MIN_PACKET_ENERGY: 1,

  // ============================================
  // NODOS ESPECIALES
  // ============================================
  /** Energía adicional que otorga un SuperEnergyNode */
  SUPER_ENERGY_ADDITION: 50,

  /** Factor de división para ArticulationNode al ser capturado */
  ARTICULATION_SPLIT_FACTOR: 0.5,

  // ============================================
  // PERFORMANCE
  // ============================================
  /** FPS objetivo del juego */
  TARGET_FPS: 60,

  /** Tiempo máximo de delta time permitido (ms) - previene jumps grandes */
  MAX_DELTA_TIME: 100,

  /** Frecuencia de actualización de UI (ms) */
  UI_UPDATE_INTERVAL: 100,

  // ============================================
  // DEBUG Y DESARROLLO
  // ============================================
  /** Modo debug activado */
  DEBUG_MODE: false,

  /** Mostrar información de colisiones en consola */
  LOG_COLLISIONS: false,

  /** Mostrar información de llegadas en consola */
  LOG_ARRIVALS: false,

  /** Mostrar información de capturas en consola */
  LOG_CAPTURES: false,
} as const;

/**
 * Tipo derivado de las constantes para type-safety
 */
export type GameConstants = typeof GAME_CONSTANTS;

/**
 * Validación de constantes
 * Lanza errores si hay valores inválidos
 */
export function validateConstants(): void {
  const { DOMINANCE_THRESHOLD, MIN_PLAYERS, MAX_PLAYERS } = GAME_CONSTANTS;

  if (DOMINANCE_THRESHOLD < 0 || DOMINANCE_THRESHOLD > 1) {
    throw new Error('DOMINANCE_THRESHOLD debe estar entre 0 y 1');
  }

  if (MIN_PLAYERS < 2) {
    throw new Error('MIN_PLAYERS debe ser al menos 2');
  }

  if (MAX_PLAYERS < MIN_PLAYERS) {
    throw new Error('MAX_PLAYERS debe ser mayor o igual a MIN_PLAYERS');
  }
}

// Validar constantes al cargar el módulo
validateConstants();
