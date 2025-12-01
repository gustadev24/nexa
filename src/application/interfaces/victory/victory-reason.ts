export const VictoryReason = {
  DOMINANCE: 'dominance',
  TIMEOUT: 'timeout',
  ELIMINATION: 'elimination',
  DRAW: 'draw',
};

export type VictoryReason = typeof VictoryReason[keyof typeof VictoryReason];
