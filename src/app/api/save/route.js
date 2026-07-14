import { NextResponse } from 'next/server';
import { getDb, isMongoConfigured } from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

const PLAYER_ID_RE = /^[a-zA-Z0-9_-]{6,64}$/;

// GET /api/save?player=<id> → the player's cloud save (or null).
export async function GET(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: false, reason: 'mongo-not-configured' }, { status: 503 });
  }
  const player = new URL(request.url).searchParams.get('player') || '';
  if (!PLAYER_ID_RE.test(player)) {
    return NextResponse.json({ ok: false, reason: 'bad-player-id' }, { status: 400 });
  }
  try {
    const db = await getDb();
    const doc = await db.collection('saves').findOne({ player }, { projection: { _id: 0 } });
    return NextResponse.json({ ok: true, save: doc?.save ?? null, updatedAt: doc?.updatedAt ?? null });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 503 });
  }
}

// POST /api/save { player, save } → upsert the cloud save.
export async function POST(request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ ok: false, reason: 'mongo-not-configured' }, { status: 503 });
  }
  try {
    const { player, save } = await request.json();
    if (!PLAYER_ID_RE.test(String(player || ''))) {
      return NextResponse.json({ ok: false, reason: 'bad-player-id' }, { status: 400 });
    }
    if (!save || typeof save !== 'object') {
      return NextResponse.json({ ok: false, reason: 'bad-save' }, { status: 400 });
    }
    // Cap document size defensively (~1MB Mongo limit).
    if (JSON.stringify(save).length > 400_000) {
      return NextResponse.json({ ok: false, reason: 'save-too-large' }, { status: 413 });
    }
    const db = await getDb();
    await db.collection('saves').updateOne(
      { player },
      { $set: { player, save, updatedAt: Date.now() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 503 });
  }
}
