export const GameStatus = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];
