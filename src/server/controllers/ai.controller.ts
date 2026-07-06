import type { Request, Response } from 'express';
import { FeliChatError, runFeliChat, type FeliChatMessage } from '@/lib/feli-chat';

export async function chatWithFeli(req: Request, res: Response) {
  try {
    const { messages } = req.body as { messages?: FeliChatMessage[] };
    const reply = await runFeliChat(messages ?? []);
    return res.json({ reply });
  } catch (err) {
    if (err instanceof FeliChatError) {
      return res.status(err.status).json({ message: err.message });
    }

    console.error('[Feli AI]', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
}
