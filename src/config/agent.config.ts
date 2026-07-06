/** Feli virtual agent — mood states & accent colors. */

export type AgentCharacterState = 'idle' | 'greeting' | 'thinking' | 'happy';

export const AGENT_STATE_COLORS: Record<AgentCharacterState, string> = {
  idle: '#e11d48',
  greeting: '#f472b6',
  thinking: '#a855f7',
  happy: '#fbbf24',
};

export const AGENT_STATE_SECONDARY: Record<AgentCharacterState, string> = {
  idle: '#a855f7',
  greeting: '#e11d48',
  thinking: '#6366f1',
  happy: '#f43f5e',
};
