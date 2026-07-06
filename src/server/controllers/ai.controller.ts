import type { Request, Response } from 'express';
import { FELI_SYSTEM_PROMPT } from '@/config/feli-knowledge';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function chatWithFeli(req: Request, res: Response) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || 'anthropic/claude-haiku-4.5';

    if (!apiKey) {
      return res.status(503).json({ message: 'AI guide is not configured yet.' });
    }

    const { messages } = req.body as { messages?: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    const trimmed = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

    if (!trimmed.length || trimmed[trimmed.length - 1].role !== 'user') {
      return res.status(400).json({ message: 'Last message must be from user' });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'Felovy - Feli AI Guide',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: FELI_SYSTEM_PROMPT }, ...trimmed],
        max_tokens: 900,
        temperature: 0.65,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[Feli AI] upstream error', upstream.status, errText.slice(0, 500));
      return res.status(502).json({ message: 'AI guide is temporarily unavailable. Please try again.' });
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ message: 'Empty response from AI guide.' });
    }

    return res.json({ reply });
  } catch (err) {
    console.error('[Feli AI]', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}
