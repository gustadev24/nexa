import { AIDifficulty, AIStrategyType, GameDifficulty, type IColor } from '@/core/types/common';
import { VictoryType, type IGameConfig } from '@/core/types/game';
import type { IAIStrategy } from '@/core/types/player';

/**
 * Predefined player colors
 */
export const PLAYER_COLORS: Record<string, IColor> = {
  BLUE: { r: 0, g: 150, b: 255, hex: '#0096FF' },
  RED: { r: 255, g: 50, b: 50, hex: '#FF3232' },
  GREEN: { r: 0, g: 255, b: 100, hex: '#00FF64' },
  YELLOW: { r: 255, g: 220, b: 0, hex: '#FFDC00' },
  PURPLE: { r: 200, g: 50, b: 255, hex: '#C832FF' },
  CYAN: { r: 0, g: 255, b: 255, hex: '#00FFFF' },
  ORANGE: { r: 255, g: 150, b: 0, hex: '#FF9600' },
  PINK: { r: 255, g: 100, b: 200, hex: '#FF64C8' },
};

/**
 * Default game configuration
 * Aligned with NEXA game document specifications
 */
export const DEFAULT_GAME_CONFIG: IGameConfig = {
  maxPlayers: 4,
  minPlayers: 2,
  mapWidth: 1024,
  mapHeight: 768,
  initialNodeCount: 20,
  difficulty: GameDifficulty.NORMAL,
  timeLimit: 180000, // 3 minutes (180000ms) as per document
  attackInterval: 20, // 20ms as per document
  defenseUpdateInterval: 30, // 30ms as per document
  enableFogOfWar: false,
  startingEnergy: 100, // Initial total energy pool
  victoryConditions: {
    type: VictoryType.DOMINATION,
    nodeControlPercentage: 70, // 70% as per document
    controlDuration: 10000, // 10 seconds as per document
    timeLimit: 180000, // 3 minutes as per document
  },
  gameSpeed: 1.0,
};

/**
 * Default AI strategies for different difficulty levels
 */
export const DEFAULT_AI_STRATEGIES: Record<AIDifficulty, Partial<IAIStrategy>> = {
  [AIDifficulty.EASY]: {
    difficulty: AIDifficulty.EASY,
    type: AIStrategyType.BALANCED,
    aggressiveness: 30,
    expansionPriority: 50,
    defensePriority: 40,
    economicPriority: 60,
    reactionTime: 2000,
    decisionInterval: 3000,
  },
  [AIDifficulty.MEDIUM]: {
    difficulty: AIDifficulty.MEDIUM,
    type: AIStrategyType.BALANCED,
    aggressiveness: 50,
    expansionPriority: 60,
    defensePriority: 50,
    economicPriority: 50,
    reactionTime: 1000,
    decisionInterval: 2000,
  },
  [AIDifficulty.HARD]: {
    difficulty: AIDifficulty.HARD,
    type: AIStrategyType.AGGRESSIVE,
    aggressiveness: 75,
    expansionPriority: 70,
    defensePriority: 60,
    economicPriority: 40,
    reactionTime: 500,
    decisionInterval: 1500,
  },
  [AIDifficulty.EXPERT]: {
    difficulty: AIDifficulty.EXPERT,
    type: AIStrategyType.AGGRESSIVE,
    aggressiveness: 90,
    expansionPriority: 85,
    defensePriority: 75,
    economicPriority: 60,
    reactionTime: 200,
    decisionInterval: 1000,
  },
};
