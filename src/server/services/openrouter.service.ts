const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 30_000;

function asciiHeader(value: string, fallback: string): string {
  const sanitized = value.replace(/[^\x20-\x7E]/g, '').trim();
  return sanitized || fallback;
}

export async function openRouterCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; title?: string },
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const model = process.env.AI_MODEL || 'anthropic/claude-haiku-4.5';
  const siteUrl = asciiHeader(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', 'http://localhost:3000');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': asciiHeader(options?.title || 'Felovy Bot Generator', 'Felovy Bot Generator'),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options?.maxTokens ?? 900,
        temperature: options?.temperature ?? 0.75,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenRouter error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty LLM response');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract JSON object from LLM output (handles markdown fences). */
export function parseJsonFromLlm<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();
  return JSON.parse(candidate) as T;
}
