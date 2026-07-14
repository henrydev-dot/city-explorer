import { NextResponse } from 'next/server';
import { getDb, isMongoConfigured } from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 60;

// GET /api/chat?after=<ts> → messages newer than `after` (or the latest page).
export async function GET(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: false, reason: 'mongo-not-configured' }, { status: 503 });
  }
  try {
    const after = Number(new URL(request.url).searchParams.get('after') || 0);
    const db = await getDb();
    const messages = await db.collection('chat')
      .find(after > 0 ? { ts: { $gt: after } } : {})
      .sort({ ts: -1 })
      .limit(MAX_MESSAGES)
      .project({ _id: 0 })
      .toArray();
    return NextResponse.json({ ok: true, messages: messages.reverse() });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 503 });
  }
}

// POST /api/chat { author, text }
export async function POST(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: false, reason: 'mongo-not-configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const author = String(body.author || 'Anonymous').slice(0, 40);
    const player = String(body.player || '').slice(0, 64);
    const text = String(body.text || '').trim().slice(0, 240);
    if (!text) return NextResponse.json({ ok: false, reason: 'empty' }, { status: 400 });

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      player,
      text,
      ts: Date.now(),
    };
    const db = await getDb();
    await db.collection('chat').insertOne({ ...message });
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 503 });
  }
}
