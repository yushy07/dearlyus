import { getSupabase } from '../supabase';

export type BoothRoom = {
  id: string;
  code: string;
  hostId: string;
  expiresAt: string;
};
export type BoothMessage = { type: string; [key: string]: unknown };
export type PhotoTransferStatus = {
  photoId: string;
  state: 'sending' | 'retrying' | 'sent' | 'receiving' | 'received' | 'failed';
  attempt?: number;
};
export type MediaConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'unavailable';
export type BoothSnapshot = {
  shots: unknown[];
  design: Record<string, unknown>;
  approvals: string[];
  editor?: string;
  revision?: number;
};
export type BoothSavedState = {
  revision: number;
  snapshot: BoothSnapshot;
  updatedAt?: string;
};
type Envelope = { sender: string; message: BoothMessage };

function boothError(message: string) {
  const text = message.toLowerCase();
  if (text.includes('expired'))
    return 'This booth invitation has expired. Create a new booth to continue.';
  if (text.includes('closed'))
    return 'This booth has been closed. Create a new booth to continue.';
  if (text.includes('full')) return 'This booth already has two people.';
  if (text.includes('stale') || text.includes('revision'))
    return 'A newer edit was saved by your partner. The booth will refresh before you continue.';
  if (text.includes('not a member') || text.includes('access'))
    return 'You no longer have access to this private booth.';
  return message;
}

async function roomRpc<T>(name: string, args: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb)
    throw new Error(
      'Online booths are not configured yet. You can use the solo booth.',
    );
  const { data, error } = await sb.rpc(name, args);
  if (error) throw new Error(boothError(error.message));
  return data as T;
}

export async function getBoothState(roomId: string) {
  return roomRpc<BoothSavedState>('get_photobooth_state', {
    target_room: roomId,
  });
}

export async function saveBoothState(
  roomId: string,
  expectedRevision: number,
  snapshot: BoothSnapshot,
) {
  return roomRpc<BoothSavedState>('save_photobooth_state', {
    target_room: roomId,
    expected_revision: expectedRevision,
    next_snapshot: snapshot,
  });
}

export async function touchBoothRoom(roomId: string) {
  return roomRpc<BoothRoom>('touch_photobooth_room', { target_room: roomId });
}

export async function closeBoothRoom(roomId: string) {
  await roomRpc('close_photobooth_room', { target_room: roomId });
}
export async function openBoothRoom(
  code?: string,
): Promise<{ room: BoothRoom; userId: string }> {
  const sb = getSupabase();
  if (!sb)
    throw new Error(
      'Online booths are not configured yet. You can use the solo booth.',
    );
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    throw new Error(
      'Sign in to create or join a private booth. Your invitation will be kept.',
    );
  const { data, error } = await sb.rpc(
    code ? 'join_photobooth_room' : 'create_photobooth_room',
    code ? { invite_code: code.trim().toUpperCase() } : {},
  );
  if (error) throw new Error(boothError(error.message));
  return { room: data as BoothRoom, userId: user.id };
}

/** Private, membership-authorized signaling. Media is never written to a database. */
export class BoothConnection {
  private sb = getSupabase()!;
  private channel: ReturnType<
    NonNullable<ReturnType<typeof getSupabase>>['channel']
  >;
  private pc: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private candidates: RTCIceCandidateInit[] = [];
  private remoteId = '';
  private disposed = false;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private lastSeen = 0;
  private online = false;
  private chunks = new Map<
    string,
    {
      parts: (string | undefined)[];
      count: number;
      at: number;
      meta: BoothMessage;
    }
  >();
  private acknowledgements = new Map<string, () => void>();
  private completedTransfers = new Map<string, number>();
  private makingOffer = false;
  private ice: RTCIceServer[] = [{ urls: 'stun:stun.cloudflare.com:3478' }];
  constructor(
    readonly room: BoothRoom,
    readonly userId: string,
    private onMessage: (message: BoothMessage) => void,
    private onPresence: (online: boolean) => void,
    private onStream: (stream: MediaStream | null) => void,
    private onError: (message: string) => void,
    private onTransfer: (status: PhotoTransferStatus) => void = () => {},
    private onMediaState: (status: MediaConnectionState) => void = () => {},
  ) {
    this.channel = this.sb.channel(`photobooth:${room.id}`, {
      config: { private: true, broadcast: { ack: true, self: false } },
    });
  }
  async connect() {
    // Optional project-managed relay credentials. No permanent TURN secrets in the client.
    const { data } = await this.sb.rpc('get_photobooth_ice_servers', {
      target_room: this.room.id,
    });
    if (Array.isArray(data) && data.length) this.ice = data;
    if (this.disposed) return;
    this.channel.on(
      'broadcast',
      { event: 'booth' },
      ({ payload }: { payload: Envelope }) => {
        if (
          !payload ||
          payload.sender === this.userId ||
          !payload.message?.type
        )
          return;
        this.remoteId = payload.sender;
        this.lastSeen = Date.now();
        if (!this.online) {
          this.online = true;
          this.onPresence(true);
        }
        void this.receive(payload.message).catch((e) =>
          this.onError(
            e.message || 'Connection interrupted. Please reconnect.',
          ),
        );
      },
    );
    await new Promise<void>((resolve, reject) =>
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          reject(
            new Error(
              'The private booth could not connect. Check your connection and try again.',
            ),
          );
      }),
    );
    await this.send({ type: 'hello' });
    this.heartbeat = setInterval(() => {
      void this.send({ type: 'heartbeat', time: Date.now() }).catch(() => {});
      if (this.online && Date.now() - this.lastSeen > 9000) {
        this.online = false;
        this.onPresence(false);
        this.onStream(null);
        this.onMediaState('unavailable');
        this.pc?.close();
        this.pc = null;
      }
      for (const [id, transfer] of this.chunks)
        if (Date.now() - transfer.at > 30000) this.chunks.delete(id);
      for (const [id, at] of this.completedTransfers)
        if (Date.now() - at > 120000) this.completedTransfers.delete(id);
    }, 2500);
  }
  async send(message: BoothMessage) {
    if (this.disposed) throw new Error('The booth has closed.');
    const result = await this.channel.send({
      type: 'broadcast',
      event: 'booth',
      payload: { sender: this.userId, message },
    });
    if (result !== 'ok')
      throw new Error(
        'Your partner could not receive the update. Please retry.',
      );
  }
  private peer() {
    if (this.pc) return this.pc;
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    this.pc = pc;
    for (const track of this.stream?.getTracks() ?? [])
      pc.addTrack(track, this.stream!);
    pc.onicecandidate = (event) => {
      if (event.candidate)
        void this.send({
          type: 'ice',
          candidate: event.candidate.toJSON(),
        }).catch(() => {});
    };
    pc.ontrack = (event) =>
      this.onStream(event.streams[0] ?? new MediaStream([event.track]));
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connecting') this.onMediaState('connecting');
      if (pc.connectionState === 'connected') this.onMediaState('connected');
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected'
      ) {
        this.onStream(null);
        this.onMediaState('unavailable');
        this.onError(
          'Live video is unavailable on this network. Use the private shared upload slots below; editing and messages remain connected.',
        );
      }
    };
    return pc;
  }
  async setStream(stream: MediaStream) {
    this.stream = stream;
    this.pc?.close();
    this.pc = null;
    this.onMediaState('connecting');
    await this.send({ type: 'media-ready' });
    if (this.userId === this.room.hostId && this.remoteId) await this.offer();
  }
  private async offer() {
    if (!this.stream || this.makingOffer || this.disposed) return;
    this.makingOffer = true;
    try {
      const pc = this.peer();
      await pc.setLocalDescription(await pc.createOffer());
      await this.send({ type: 'offer', description: pc.localDescription });
    } finally {
      this.makingOffer = false;
    }
  }
  async sendPhoto(meta: BoothMessage, src: string) {
    const id = crypto.randomUUID(),
      count = Math.ceil(src.length / 40000);
    const photoId = String(
      (meta.photo as { id?: unknown } | undefined)?.id ?? id,
    );
    if (src.length > 6000000)
      throw new Error('That photo is too large. Please try a smaller image.');
    for (let attempt = 0; attempt < 3; attempt++) {
      this.onTransfer({
        photoId,
        state: attempt ? 'retrying' : 'sending',
        attempt: attempt + 1,
      });
      let acked = false;
      this.acknowledgements.set(id, () => {
        acked = true;
      });
      for (let part = 0; part < count; part++)
        await this.send({
          type: 'photo-part',
          id,
          part,
          count,
          meta,
          data: src.slice(part * 40000, (part + 1) * 40000),
        });
      const until = Date.now() + 6000;
      while (!acked && Date.now() < until && !this.disposed)
        await new Promise((resolve) => setTimeout(resolve, 100));
      this.acknowledgements.delete(id);
      if (acked) {
        this.onTransfer({ photoId, state: 'sent', attempt: attempt + 1 });
        return;
      }
    }
    this.onTransfer({ photoId, state: 'failed', attempt: 3 });
    throw new Error(
      'Your photo was kept on this device, but delivery failed. Use Resend photos after reconnecting.',
    );
  }
  private async receive(m: BoothMessage) {
    switch (m.type) {
      case 'hello':
        await this.send({ type: 'welcome' });
        this.onMessage(m);
        return;
      case 'heartbeat':
        return;
      case 'welcome':
        this.onMessage(m);
        return;
      case 'media-ready':
        if (this.userId === this.room.hostId) {
          this.pc?.close();
          this.pc = null;
          await this.offer();
        }
        return;
      case 'offer': {
        if (this.userId === this.room.hostId) return;
        const pc = this.peer();
        await pc.setRemoteDescription(
          m.description as RTCSessionDescriptionInit,
        );
        for (const c of this.candidates.splice(0)) await pc.addIceCandidate(c);
        await pc.setLocalDescription(await pc.createAnswer());
        await this.send({ type: 'answer', description: pc.localDescription });
        return;
      }
      case 'answer':
        if (this.pc?.signalingState === 'have-local-offer') {
          await this.pc.setRemoteDescription(
            m.description as RTCSessionDescriptionInit,
          );
          for (const c of this.candidates.splice(0))
            await this.pc.addIceCandidate(c);
        }
        return;
      case 'ice':
        if (this.pc?.remoteDescription)
          await this.pc.addIceCandidate(m.candidate as RTCIceCandidateInit);
        else if (this.candidates.length < 100)
          this.candidates.push(m.candidate as RTCIceCandidateInit);
        return;
      case 'photo-ack':
        this.acknowledgements.get(String(m.id))?.();
        return;
      case 'photo-part': {
        const { id, part, count, data, meta } = m;
        if (
          typeof id !== 'string' ||
          typeof part !== 'number' ||
          typeof count !== 'number' ||
          !Number.isInteger(part) ||
          !Number.isInteger(count) ||
          count < 1 ||
          count > 150 ||
          part < 0 ||
          part >= count ||
          typeof data !== 'string' ||
          data.length > 40000
        )
          return;
        if (this.completedTransfers.has(id)) {
          await this.send({ type: 'photo-ack', id });
          return;
        }
        const photo = (
          meta as { photo?: { id?: unknown; shotId?: unknown; side?: unknown } }
        )?.photo;
        if (
          (meta as BoothMessage)?.type !== 'photo' ||
          typeof photo?.id !== 'string' ||
          typeof photo?.shotId !== 'string' ||
          (photo?.side !== 'left' && photo?.side !== 'right')
        )
          return;
        let transfer = this.chunks.get(id);
        if (!transfer) {
          if (this.chunks.size >= 12) return;
          transfer = {
            parts: Array.from({ length: count }, () => undefined),
            count,
            at: Date.now(),
            meta: meta as BoothMessage,
          };
          this.chunks.set(id, transfer);
          this.onTransfer({ photoId: photo.id, state: 'receiving' });
        }
        if (transfer.count !== count) return;
        transfer.parts[part] = data;
        if (
          Array.from(
            { length: count },
            (_, i) => typeof transfer!.parts[i] === 'string',
          ).every(Boolean)
        ) {
          const src = transfer.parts.join('');
          this.chunks.delete(id);
          if (!/^data:image\/(jpeg|webp|png);base64,/.test(src)) return;
          this.completedTransfers.set(id, Date.now());
          this.onMessage({ ...transfer.meta, type: 'photo', src });
          this.onTransfer({ photoId: photo.id, state: 'received' });
          await this.send({ type: 'photo-ack', id });
        }
        return;
      }
      default:
        this.onMessage(m);
    }
  }
  close() {
    this.disposed = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.pc?.close();
    this.chunks.clear();
    this.acknowledgements.clear();
    this.completedTransfers.clear();
    void this.sb.removeChannel(this.channel);
  }
}
