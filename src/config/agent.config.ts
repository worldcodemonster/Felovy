/** Feli virtual agent — mood states & accent colors. */

export type AgentCharacterState = 'idle' | 'greeting' | 'thinking' | 'happy';

export const AGENT_STATE_COLORS: Record<AgentCharacterState, string> = {
  idle: '#15803d',
  greeting: '#66b38c',
  thinking: '#166534',
  happy: '#fbbf24',
};

export const AGENT_STATE_SECONDARY: Record<AgentCharacterState, string> = {
  idle: '#22c55e',
  greeting: '#15803d',
  thinking: '#4ade80',
  happy: '#22c55e',
};
