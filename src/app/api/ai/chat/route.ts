import { NextResponse } from 'next/server';
import { FeliChatError, runFeliChat, type FeliChatMessage } from '@/lib/feli-chat';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: FeliChatMessage[] };
    const reply = await runFeliChat(body.messages ?? []);
    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof FeliChatError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    console.error('[Feli AI]', err);
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
