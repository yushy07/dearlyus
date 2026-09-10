'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BoothConnection,
  openBoothRoom,
  type BoothMessage,
  type BoothRoom,
} from '@/lib/booth/connection';
import {
  INITIAL_DESIGN,
  DEFAULT_CROP,
  clampCrop,
  putPhoto,
  completeShot,
  approvalKey,
  type Shot,
  type Side,
  type Photo,
  type Crop,
  type BoothDesign,
} from '@/lib/booth/model';

export function useBoothStudio() {
  const [room, setRoom] = useState<BoothRoom | null>(null);
  const [solo, setSolo] = useState(false),
    [side, setSide] = useState<Side>('left');
  const [stream, setStream] = useState<MediaStream | null>(null),
    [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [online, setOnline] = useState(false),
    [ready, setReady] = useState(false),
    [partnerReady, setPartnerReady] = useState(false);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [countdown, setCountdown] = useState<number | null>(null);
  const [activeCut, setActiveCut] = useState(0),
    [shooting, setShooting] = useState(false),
    [flash, setFlash] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]),
    [design, setDesign] = useState<BoothDesign>(INITIAL_DESIGN);
  const [editor, setEditor] = useState<Side>('left'),
    [approved, setApproved] = useState<Side[]>([]);
  const [revision, setRevision] = useState(0),
    [mic, setMic] = useState(false),
    [cameraBusy, setCameraBusy] = useState(false);
  const connection = useRef<BoothConnection | null>(null),
    localVideo = useRef<HTMLVideoElement | null>(null);
  const media = useRef<MediaStream | null>(null),
    generation = useRef(0),
    cameraGeneration = useRef(0);
  const state = useRef({
    shots,
    design,
    side,
    solo,
    ready,
    partnerReady,
    online,
    editor,
    revision,
    approved,
  });
  state.current = {
    shots,
    design,
    side,
    solo,
    ready,
    partnerReady,
    online,
    editor,
    revision,
    approved,
  };
  const messageHandler = useRef<(m: BoothMessage) => Promise<void>>(
    async () => {},
  );
  const deadline = useRef<ReturnType<typeof setInterval> | null>(null),
    clockOffset = useRef(0),
    running = useRef(false);
  const readyRef = useRef(false),
    capturePlan = useRef<{ shotId: string; index: number; at: number } | null>(
      null,
    );
  const history = useRef<BoothDesign[]>([]),
    stop = useRef(false);
  const fail = useCallback(
    (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    [],
  );
  const send = useCallback(async (m: BoothMessage) => {
    if (connection.current) await connection.current.send(m);
  }, []);
  const changeShots = (fn: (shots: Shot[]) => Shot[]) => {
    state.current.shots = fn(state.current.shots);
    setShots(state.current.shots);
    setApproved([]);
  };
  const resetReady = () => {
    readyRef.current = false;
    state.current.ready = false;
    state.current.partnerReady = false;
    setReady(false);
    setPartnerReady(false);
  };
  const cancelLocal = () => {
    stop.current = true;
    running.current = false;
    capturePlan.current = null;
    if (deadline.current) clearInterval(deadline.current);
    deadline.current = null;
    setCountdown(null);
    setShooting(false);
    resetReady();
  };
  async function cancel() {
    cancelLocal();
    await send({ type: 'cancel' }).catch(fail);
  }
  const shutdown = () => {
    generation.current++;
    cameraGeneration.current++;
    cancelLocal();
    connection.current?.close();
    connection.current = null;
    media.current?.getTracks().forEach((t) => t.stop());
    media.current = null;
    setStream(null);
    setRemoteStream(null);
    setOnline(false);
  };
  useEffect(
    () => () => {
      generation.current++;
      cameraGeneration.current++;
      connection.current?.close();
      media.current?.getTracks().forEach((t) => t.stop());
      if (deadline.current) clearInterval(deadline.current);
    },
    [],
  );
  useEffect(() => {
    const hide = () => {
      if (document.hidden && readyRef.current) {
        cancelLocal();
        void send({ type: 'cancel' }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [send]);
  async function enter(code?: string) {
    setBusy(true);
    setError('');
    shutdown();
    setSolo(false);
    setRoom(null);
    const gen = generation.current;
    try {
      const session = await openBoothRoom(code);
      if (gen !== generation.current) return;
      const role = session.room.hostId === session.userId ? 'left' : 'right';
      setSide(role);
      state.current.side = role;
      setRoom(session.room);
      setShots([]);
      state.current.shots = [];
      setApproved([]);
      setDesign({
        ...INITIAL_DESIGN,
        date: new Date().toISOString().slice(0, 10),
      });
      const link = new BoothConnection(
        session.room,
        session.userId,
        (m) => {
          void messageHandler.current(m).catch(fail);
        },
        (value) => {
          state.current.online = value;
          setOnline(value);
          if (!value) {
            cancelLocal();
            setError(
              'Your partner disconnected. Photos remain here; reconnect and resend them to continue.',
            );
          }
        },
        setRemoteStream,
        setError,
      );
      connection.current = link;
      await link.connect();
      if (gen !== generation.current) {
        link.close();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.set('room', session.room.code);
      window.history.replaceState(null, '', url);
    } catch (e) {
      fail(e);
      connection.current?.close();
      connection.current = null;
      setRoom(null);
    } finally {
      setBusy(false);
    }
  }
  function enterSolo() {
    shutdown();
    history.current = [];
    setEditor('left');
    setRevision(0);
    state.current.editor = 'left';
    state.current.revision = 0;
    setRoom(null);
    setSolo(true);
    setSide('left');
    setShots([]);
    setApproved([]);
    state.current.solo = true;
    state.current.side = 'left';
    state.current.shots = [];
    setDesign({
      ...INITIAL_DESIGN,
      date: new Date().toISOString().slice(0, 10),
    });
    setError('');
  }
  async function enableCamera() {
    setCameraBusy(true);
    setError('');
    const gen = ++cameraGeneration.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          'Camera access needs HTTPS and a supported browser. You can still upload photos.',
        );
      const next = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: false,
      });
      if (gen !== cameraGeneration.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      media.current?.getTracks().forEach((t) => t.stop());
      media.current = next;
      setStream(next);
      setMic(false);
      next.getVideoTracks()[0].onended = () => {
        cancelLocal();
        setError('Camera stopped. Enable it again before continuing.');
        void send({ type: 'cancel' }).catch(() => {});
      };
      if (connection.current) await connection.current.setStream(next);
    } catch (e) {
      fail(e);
    } finally {
      setCameraBusy(false);
    }
  }
  async function toggleMic() {
    try {
      const existing = media.current?.getAudioTracks()[0];
      if (existing) {
        existing.enabled = !existing.enabled;
        setMic(existing.enabled);
        return;
      }
      if (!media.current) throw new Error('Enable your camera first.');
      const targetStream = media.current;
      const session = generation.current;
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== generation.current || media.current !== targetStream) {
        audio.getTracks().forEach((track) => track.stop());
        return;
      }
      audio.getTracks().forEach((t) => targetStream.addTrack(t));
      setMic(true);
      await connection.current?.setStream(media.current);
    } catch (e) {
      fail(e);
    }
  }
  async function toggleReady() {
    if (
      !media.current?.getVideoTracks().some((t) => t.readyState === 'live') ||
      !localVideo.current?.videoWidth
    ) {
      setError('Your camera must be playing before you get ready.');
      return;
    }
    const value = !readyRef.current;
    readyRef.current = value;
    state.current.ready = value;
    setReady(value);
    await send({ type: 'ready', value }).catch(fail);
  }
  async function resend() {
    setBusy(true);
    setError('');
    try {
      for (const shot of state.current.shots) {
        const p = shot[state.current.side];
        if (p)
          await connection.current?.sendPhoto(
            { type: 'photo', photo: { ...p, src: undefined } },
            p.src,
          );
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function capture(shotId: string) {
    const video = localVideo.current;
    if (!video?.videoWidth || !readyRef.current)
      throw new Error('Camera is not ready. This shot was not taken.');
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1600, video.videoWidth);
    canvas.height = Math.round(
      (canvas.width * video.videoHeight) / video.videoWidth,
    );
    canvas
      .getContext('2d')!
      .drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo: Photo = {
      id: crypto.randomUUID(),
      shotId,
      side: state.current.side,
      src: canvas.toDataURL('image/jpeg', 0.93),
      crop: { ...DEFAULT_CROP },
    };
    changeShots((s) => putPhoto(s, photo));
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    if (connection.current)
      await connection.current.sendPhoto(
        { type: 'photo', photo: { ...photo, src: undefined } },
        photo.src,
      );
  }
  function schedule(plan: { shotId: string; index: number; at: number }) {
    if (deadline.current) clearInterval(deadline.current);
    setActiveCut(plan.index);
    setShooting(true);
    capturePlan.current = plan;
    const tick = () => {
      const remaining = plan.at - clockOffset.current - Date.now();
      setCountdown(Math.max(1, Math.ceil(remaining / 1000)));
      if (remaining <= 0) {
        if (deadline.current) clearInterval(deadline.current);
        deadline.current = null;
        setCountdown(null);
        void capture(plan.shotId)
          .catch((e) => {
            fail(e);
            void cancel();
          })
          .finally(() => {
            if (state.current.side === 'right') setShooting(false);
          });
      }
    };
    tick();
    deadline.current = setInterval(tick, 50);
  }
  async function begin(index: number, timer: number, automatic: boolean) {
    if (
      running.current ||
      (!state.current.solo && state.current.side !== 'left')
    )
      return;
    if (
      !readyRef.current ||
      (!state.current.solo &&
        (!state.current.partnerReady || !state.current.online))
    ) {
      setError('Both people need to be ready before the shutter starts.');
      return;
    }
    running.current = true;
    stop.current = false;
    setShooting(true);
    setError('');
    try {
      for (let i = index; i < (automatic ? 4 : index + 1); i++) {
        if (stop.current) break;
        const shotId = crypto.randomUUID();
        changeShots((s) =>
          Array.from({ length: 4 }, (_, n) =>
            n === i ? { id: shotId } : (s[n] ?? { id: crypto.randomUUID() }),
          ),
        );
        await send({
          type: 'manifest',
          ids: state.current.shots.map((s) => s.id),
          design: state.current.design,
          revision: state.current.revision,
          editor: state.current.editor,
        });
        const plan = { shotId, index: i, at: Date.now() + timer * 1000 + 700 };
        capturePlan.current = plan;
        if (state.current.solo) schedule(plan);
        else {
          await send({ type: 'capture-plan', ...plan });
          // Partner acknowledges readiness before the host starts its own countdown.
          const until = Date.now() + 2000;
          while (!deadline.current && Date.now() < until && !stop.current)
            await new Promise((r) => setTimeout(r, 50));
          if (!deadline.current && !stop.current)
            throw new Error(
              'Your partner did not confirm this shot. Please get ready and try again.',
            );
        }
        const until = plan.at + 25000;
        while (
          !completeShot(state.current.shots[i], state.current.solo) &&
          Date.now() < until &&
          !stop.current
        )
          await new Promise((r) => setTimeout(r, 100));
        if (stop.current) break;
        if (!completeShot(state.current.shots[i], state.current.solo))
          throw new Error(
            'Waiting for the other photo. Your shot is safe here—use Resend photos, or retake.',
          );
        await new Promise((r) => setTimeout(r, 1100));
      }
    } catch (e) {
      fail(e);
      await send({ type: 'cancel' }).catch(() => {});
    } finally {
      running.current = false;
      setShooting(false);
      setCountdown(null);
      capturePlan.current = null;
      resetReady();
      await send({ type: 'ready', value: false }).catch(() => {});
    }
  }
  function applyDesign(next: BoothDesign) {
    history.current = [...history.current.slice(-19), state.current.design];
    state.current.design = next;
    state.current.revision++;
    setDesign(next);
    setRevision(state.current.revision);
    setApproved([]);
    void send({
      type: 'design-state',
      design: next,
      revision: state.current.revision,
      editor: state.current.editor,
    }).catch(fail);
  }
  async function updateDesign(next: BoothDesign) {
    if (!state.current.solo && state.current.editor !== state.current.side)
      return;
    if (state.current.side === 'left' || state.current.solo) applyDesign(next);
    else
      await send({
        type: 'design-change',
        design: next,
        revision: state.current.revision,
      }).catch(fail);
  }
  function undo() {
    const previous = history.current.pop();
    if (previous) {
      const keep = history.current.slice();
      applyDesign(previous);
      history.current = keep;
    }
  }
  async function passEditor() {
    const next = state.current.editor === 'left' ? 'right' : 'left';
    if (state.current.side === 'left') {
      state.current.editor = next;
      setEditor(next);
      await send({
        type: 'design-state',
        design: state.current.design,
        revision: state.current.revision,
        editor: next,
      });
    } else await send({ type: 'return-editor' });
  }
  async function updateCrop(index: number, crop: Crop) {
    const id = state.current.shots[index]?.id;
    if (!id) return;
    const normalized = clampCrop(crop);
    changeShots((s) =>
      s.map((shot) => {
        const p = shot[state.current.side];
        return shot.id === id && p
          ? { ...shot, [state.current.side]: { ...p, crop: normalized } }
          : shot;
      }),
    );
    await send({ type: 'crop', shotId: id, crop: normalized }).catch(fail);
  }
  async function upload(file: File, index: number) {
    if (!file.type.startsWith('image/') || file.size > 20000000) {
      setError('Choose an image under 20 MB.');
      return;
    }
    if (!state.current.solo && state.current.shots.length !== 4) {
      setError('The host must prepare the four frames first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const bitmap = await createImageBitmap(file),
        canvas = document.createElement('canvas');
      canvas.width = Math.min(bitmap.width, 1600);
      canvas.height = Math.round((canvas.width * bitmap.height) / bitmap.width);
      canvas
        .getContext('2d')!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      if (!state.current.shots.length)
        changeShots(() =>
          Array.from({ length: 4 }, () => ({ id: crypto.randomUUID() })),
        );
      const photo: Photo = {
        id: crypto.randomUUID(),
        shotId: state.current.shots[index].id,
        side: state.current.side,
        src: canvas.toDataURL('image/jpeg', 0.93),
        crop: { ...DEFAULT_CROP },
      };
      changeShots((s) => putPhoto(s, photo));
      if (connection.current)
        await connection.current.sendPhoto(
          { type: 'photo', photo: { ...photo, src: undefined } },
          photo.src,
        );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function prepareFrames() {
    if (state.current.side !== 'left') return;
    if (!state.current.shots.length)
      changeShots(() =>
        Array.from({ length: 4 }, () => ({ id: crypto.randomUUID() })),
      );
    await send({
      type: 'manifest',
      ids: state.current.shots.map((s) => s.id),
      design: state.current.design,
      revision: state.current.revision,
      editor: state.current.editor,
    }).catch(fail);
  }
  async function approve() {
    if (
      state.current.shots.length !== 4 ||
      !state.current.shots.every((shot) =>
        completeShot(shot, state.current.solo),
      )
    )
      return;
    setApproved((prev) => [...new Set([...prev, state.current.side])]);
    await send({
      type: 'approve',
      revision: state.current.revision,
      reviewKey: approvalKey(state.current.shots, state.current.design),
    }).catch(fail);
  }
  messageHandler.current = async (m) => {
    const other: Side = state.current.side === 'left' ? 'right' : 'left';
    if (m.type === 'hello' || m.type === 'welcome') {
      await send({ type: 'ready', value: readyRef.current });
      if (state.current.side === 'left') await prepareFrames();
      else await send({ type: 'ping', at: Date.now() });
    } else if (m.type === 'ping')
      await send({ type: 'pong', at: m.at, hostTime: Date.now() });
    else if (m.type === 'pong' && state.current.side === 'right')
      clockOffset.current =
        Number(m.hostTime) - (Number(m.at) + Date.now()) / 2;
    else if (m.type === 'ready') {
      state.current.partnerReady = m.value === true;
      setPartnerReady(m.value === true);
    } else if (m.type === 'cancel') cancelLocal();
    else if (
      m.type === 'manifest' &&
      state.current.side === 'right' &&
      Array.isArray(m.ids) &&
      m.ids.length === 4
    ) {
      changeShots((s) =>
        (m.ids as string[]).map(
          (id) => s.find((shot) => shot.id === id) ?? { id },
        ),
      );
      setDesign(m.design as BoothDesign);
      state.current.design = m.design as BoothDesign;
      setEditor(m.editor as Side);
      setRevision(Number(m.revision));
      state.current.revision = Number(m.revision);
    } else if (m.type === 'capture-plan' && state.current.side === 'right') {
      if (
        !readyRef.current ||
        !localVideo.current?.videoWidth ||
        Number(m.at) - clockOffset.current - Date.now() < 300
      ) {
        await send({ type: 'cancel' });
        return;
      }
      const plan = {
        shotId: String(m.shotId),
        index: Number(m.index),
        at: Number(m.at),
      };
      schedule(plan);
      await send({ type: 'capture-ack', shotId: m.shotId });
    } else if (
      m.type === 'capture-ack' &&
      state.current.side === 'left' &&
      capturePlan.current?.shotId === m.shotId
    )
      schedule(capturePlan.current!);
    else if (m.type === 'photo') {
      const p = m.photo as Photo;
      if (!p || typeof p.id !== 'string' || typeof p.shotId !== 'string')
        return;
      changeShots((s) =>
        putPhoto(s, {
          ...p,
          side: other,
          src: String(m.src),
          crop: clampCrop(p.crop ?? DEFAULT_CROP),
        }),
      );
    } else if (m.type === 'crop') {
      changeShots((s) =>
        s.map((shot) => {
          const p = shot[other];
          return shot.id === m.shotId && p
            ? { ...shot, [other]: { ...p, crop: clampCrop(m.crop as Crop) } }
            : shot;
        }),
      );
    } else if (
      m.type === 'design-change' &&
      state.current.side === 'left' &&
      state.current.editor === 'right'
    ) {
      if (m.revision === state.current.revision)
        applyDesign(m.design as BoothDesign);
      else
        await send({
          type: 'design-state',
          design: state.current.design,
          revision: state.current.revision,
          editor: state.current.editor,
        });
    } else if (m.type === 'design-state' && state.current.side === 'right') {
      state.current.design = m.design as BoothDesign;
      state.current.editor = m.editor as Side;
      state.current.revision = Number(m.revision);
      setDesign(state.current.design);
      setEditor(state.current.editor);
      setRevision(state.current.revision);
      setApproved([]);
    } else if (m.type === 'return-editor' && state.current.side === 'left') {
      state.current.editor = 'left';
      setEditor('left');
      await send({
        type: 'design-state',
        design: state.current.design,
        revision: state.current.revision,
        editor: 'left',
      });
    } else if (m.type === 'approve' && m.revision === state.current.revision) {
      if (
        state.current.shots.length === 4 &&
        state.current.shots.every((shot) => completeShot(shot)) &&
        approvalKey(state.current.shots, state.current.design) === m.reviewKey
      )
        setApproved((prev) => [...new Set([...prev, other])]);
    }
  };
  return {
    room,
    solo,
    side,
    stream,
    remoteStream,
    online,
    ready,
    partnerReady,
    error,
    busy,
    cameraBusy,
    countdown,
    activeCut,
    shooting,
    flash,
    shots,
    design,
    editor,
    approved,
    revision,
    mic,
    localVideo,
    enter,
    enterSolo,
    enableCamera,
    toggleMic,
    toggleReady,
    begin,
    cancel,
    resend,
    updateDesign,
    undo,
    passEditor,
    updateCrop,
    upload,
    prepareFrames,
    approve,
    setError,
    leave: () => {
      shutdown();
      setRoom(null);
      setSolo(false);
      setShots([]);
    },
  };
}
