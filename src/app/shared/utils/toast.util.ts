/** Durations in ms for toast notifications. Use the shortest that still lets the user read the message. */
export const TOAST_LIFE = {
  /** Brief micro-feedback: clipboard copy, one-word confirmations. */
  BRIEF: 1600,
  /** Action confirmation: create, save, update operations. */
  DEFAULT: 3000,
} as const;
