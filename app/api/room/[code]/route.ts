import { NextRequest, NextResponse } from 'next/server';

interface RoomMessage {
  id: string;
  sender: string;
  type: string;
  payload: any;
  timestamp: number;
}

interface RoomState {
  code: string;
  lastActive: number;
  messages: RoomMessage[];
}

// In-memory transient room cache for signaling and cross-network message relay
const rooms = new Map<string, RoomState>();

// Periodically prune inactive rooms older than 2 hours
function cleanupInactiveRooms() {
  const now = Date.now();
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActive > TWO_HOURS) {
      rooms.delete(code);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  cleanupInactiveRooms();
  const roomCode = params.code?.toUpperCase() || 'LOVE';
  const url = new URL(request.url);
  const since = parseInt(url.searchParams.get('since') || '0', 10);

  const room = rooms.get(roomCode);
  if (!room) {
    return NextResponse.json({
      roomCode,
      messages: [],
      serverTime: Date.now(),
    });
  }

  const newMessages = room.messages.filter((m) => m.timestamp > since);

  return NextResponse.json({
    roomCode,
    messages: newMessages,
    serverTime: Date.now(),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  cleanupInactiveRooms();
  const roomCode = params.code?.toUpperCase() || 'LOVE';

  try {
    const body = await request.json();
    const { sender, type, payload } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing message type' }, { status: 400 });
    }

    let room = rooms.get(roomCode);
    if (!room) {
      room = {
        code: roomCode,
        lastActive: Date.now(),
        messages: [],
      };
      rooms.set(roomCode, room);
    }

    const message: RoomMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: sender || 'anonymous',
      type,
      payload: payload ?? {},
      timestamp: Date.now(),
    };

    room.lastActive = Date.now();
    room.messages.push(message);

    // Keep buffer bounded to last 60 events
    if (room.messages.length > 60) {
      room.messages.splice(0, room.messages.length - 60);
    }

    return NextResponse.json({
      ok: true,
      messageId: message.id,
      timestamp: message.timestamp,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid JSON' }, { status: 400 });
  }
}
