export const ArrivalOutcome = {
  INTEGRATED: 'integrated',
  CAPTURED: 'captured',
  NEUTRALIZED: 'neutralized',
  DEFEATED: 'defeated',
} as const;

export type ArrivalOutcome = typeof ArrivalOutcome[keyof typeof ArrivalOutcome];
