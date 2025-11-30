export const GameResultReason = {
  ELIMINATION: 'elimination',
  DRAW: 'draw',
  VICTORY: 'victory',
} as const;

export type GameResultReason = typeof GameResultReason[keyof typeof GameResultReason];
