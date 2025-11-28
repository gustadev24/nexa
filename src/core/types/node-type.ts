export const NodeType = {
  BASIC: 'basic',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  ENERGY: 'energy',
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];
