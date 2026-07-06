import { FELI_SYSTEM_PROMPT } from '@/config/feli-knowledge';

export type FeliChatMessage = { role: 'user' | 'assistant'; content: string };

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const UPSTREAM_TIMEOUT_MS = 25_000;

function asciiHeader(value: string, fallback: string): string {
  const sanitized = value.replace(/[^\x20-\x7E]/g, '').trim();
  return sanitized || fallback;
}

export class FeliChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'FeliChatError';
  }
}

export async function runFeliChat(messages: FeliChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey) {
    throw new FeliChatError('AI guide is not configured yet.', 503);
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new FeliChatError('messages array is required', 400);
  }

  const trimmed = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

  if (!trimmed.length || trimmed[trimmed.length - 1].role !== 'user') {
    throw new FeliChatError('Last message must be from user', 400);
  }

  const siteUrl = asciiHeader(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', 'http://localhost:3000');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'Felovy - Feli AI Guide',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: FELI_SYSTEM_PROMPT }, ...trimmed],
        max_tokens: 512,
        temperature: 0.65,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[Feli AI] upstream error', upstream.status, errText.slice(0, 500));

      if (upstream.status === 402) {
        throw new FeliChatError(
          'AI guide is temporarily unavailable. Please try again shortly.',
          503,
        );
      }

      throw new FeliChatError('AI guide is temporarily unavailable. Please try again.', 502);
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new FeliChatError('Empty response from AI guide.', 502);
    }

    return reply;
  } catch (err) {
    if (err instanceof FeliChatError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FeliChatError('AI guide took too long to respond. Please try again.', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
