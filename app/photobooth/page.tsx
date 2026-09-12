'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Copy,
  Download,
  Heart,
  Mic,
  MicOff,
  PenLine,
  RotateCcw,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { useBoothStudio } from '@/hooks/useBoothStudio';
import { useKeepsakeWriter } from '@/hooks/useKeepsakeWriter';
import {
  completeShot,
  DEFAULT_CROP,
  FILTERS,
  THEMES,
  BACKDROPS,
  getBackdropScene,
  POSES,
  type BoothDesign,
  type DrawPoint,
  simplifyStroke,
  logicalSize,
} from '@/lib/booth/model';
import {
  renderBooth,
  canvasBlob,
  downloadBlob,
  printSheet,
  type BoothRenderProgress,
} from '@/lib/booth/render';
import './studio.css';
import {
  clearCutouts,
  editCutout,
  personCutout,
  resetCutoutEdits,
  undoCutoutEdit,
} from '@/lib/booth/cutout';
import { pointsToBezierPath } from '@/lib/photobooth-bezier';
export { pointsToBezierPath } from '@/lib/photobooth-bezier';

const steps = ['Join', 'Get ready', 'Shoot', 'Decorate', 'Keep'];
const STICKERS = [
  '♡',
  '♥',
  '✦',
  '✿',
  '사랑해',
  '우리 둘',
  'だいすき',
  'ずっと',
  'just us.',
  'best day',
];
export default function PhotoboothPage() {
  const booth = useBoothStudio();
  const { saveKeepsake, saving, canSaveKeepsake } = useKeepsakeWriter();
  const [step, setStep] = useState(0),
    [code, setCode] = useState(''),
    [timer, setTimer] = useState(5);
  const [automatic, setAutomatic] = useState(true),
    [selected, setSelected] = useState(0),
    [grid, setGrid] = useState(false);
  const [copied, setCopied] = useState(false),
    [preview, setPreview] = useState(''),
    [renderError, setRenderError] = useState('');
  const [exporting, setExporting] = useState(false),
    [notice, setNotice] = useState(''),
    [stickerId, setStickerId] = useState('');
  const [rendering, setRendering] = useState(false);
  const [processing, setProcessing] = useState<BoothRenderProgress>({
    stage: 'ready', completed: 0, total: 0,
  });
  const [cutoutRetry, setCutoutRetry] = useState(0);
  const [refiningEdges, setRefiningEdges] = useState(false);
  const [refineMode, setRefineMode] = useState<'erase' | 'restore'>('erase');
  const [refineBrush, setRefineBrush] = useState(32);
  const [sceneLoadError, setSceneLoadError] = useState(false),
    [sceneRetry, setSceneRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [drawColor, setDrawColor] = useState('#8f5361'),
    [drawWidth, setDrawWidth] = useState(8),
    [drawing, setDrawing] = useState<DrawPoint[]>([]),
    [eraser, setEraser] = useState(false);
  const previewUrl = useRef(''),
    remoteVideo = useRef<HTMLVideoElement | null>(null),
    uploadInput = useRef<HTMLInputElement | null>(null),
    refineCanvas = useRef<HTMLCanvasElement | null>(null),
    refineStroke = useRef<DrawPoint[]>([]);
  const allDone =
    booth.shots.length === 4 &&
    booth.shots.every((s) => completeShot(s, booth.solo));
  const mayEdit = booth.solo || booth.editor === booth.side;
  const approved =
    booth.solo ||
    (booth.approved.includes('left') && booth.approved.includes('right'));
  const syncing = Object.values(booth.transfers).some((transfer) =>
    ['sending', 'retrying', 'receiving'].includes(transfer.state),
  );
  const selectedScene = getBackdropScene(booth.design.backdrop);
  useEffect(() => setReady(true), []);
  const myPhoto = booth.shots[selected]?.[booth.side];
  const sticker = booth.design.stickers.find((s) => s.id === stickerId);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCode(params.get('room') ?? '');
  }, []);
  useEffect(() => {
    if (booth.room || booth.solo) setStep(1);
  }, [booth.room?.id, booth.solo]);
  useEffect(() => {
    const video = booth.localVideo.current;
    if (video) {
      video.srcObject = booth.stream;
      void video.play().catch(() => {});
    }
  }, [booth.stream, step, booth.localVideo]);
  useEffect(() => {
    if (remoteVideo.current) {
      remoteVideo.current.srcObject = booth.remoteStream;
      void remoteVideo.current.play().catch(() => {});
    }
  }, [booth.remoteStream, step]);
  useEffect(() => {
    let active = true;
    setRendering(true);
    const timeout = setTimeout(() => {
      void renderBooth(booth.shots, booth.design, booth.solo, 0.6, setProcessing)
        .then(canvasBlob)
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          URL.revokeObjectURL(previewUrl.current);
          previewUrl.current = url;
          setPreview(url);
          setRenderError('');
          setRendering(false);
        })
        .catch((error) => {
          if (active) {
            setRendering(false);
            setRenderError(
              booth.design.composition === 'backdrop'
                ? `${error instanceof Error ? error.message : 'Background removal is unavailable.'} You can switch to original backgrounds.`
                : 'A photo could not be rendered. Please replace it before exporting.',
            );
          }
        });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [booth.shots, booth.design, booth.solo, cutoutRetry]);
  useEffect(() => {
    if (!refiningEdges || !myPhoto || !refineCanvas.current) return;
    let active = true;
    const image = new Image();
    image.src = myPhoto.src;
    void image.decode().then(() => personCutout(image)).then((cutout) => {
      if (!active || !refineCanvas.current) return;
      const canvas = refineCanvas.current;
      canvas.width = cutout.width;
      canvas.height = cutout.height;
      canvas.getContext('2d')!.drawImage(cutout, 0, 0);
    }).catch((error) => {
      if (active) booth.setError(error instanceof Error ? error.message : 'Could not open the edge refiner.');
    });
    return () => { active = false; };
  }, [refiningEdges, myPhoto?.id, myPhoto?.src, cutoutRetry]);
  const retryCutouts = () => {
    clearCutouts();
    setRenderError('');
    setCutoutRetry((value) => value + 1);
  };
  const refinerPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };
  const finishRefineStroke = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!myPhoto || !refineStroke.current.length) return;
    refineStroke.current.push(refinerPoint(event));
    try {
      await editCutout(myPhoto.src, refineStroke.current, refineMode, refineBrush);
      setCutoutRetry((value) => value + 1);
    } catch (error) {
      booth.setError(error instanceof Error ? error.message : 'Could not refine this edge.');
    } finally {
      refineStroke.current = [];
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  useEffect(() => {
    if (booth.design.composition !== 'backdrop') {
      setSceneLoadError(false);
      return;
    }
    let active = true;
    const image = new Image();
    image.onload = () => active && setSceneLoadError(false);
    image.onerror = () => active && setSceneLoadError(true);
    image.src = `${selectedScene.image}?scene=${sceneRetry}`;
    return () => {
      active = false;
    };
  }, [booth.design.composition, selectedScene.image, sceneRetry]);
  useEffect(
    () => () => {
      URL.revokeObjectURL(previewUrl.current);
      clearCutouts();
    },
    [],
  );
  const patch = (change: Partial<BoothDesign>) => {
    void booth.updateDesign({ ...booth.design, ...change });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/photobooth?room=${booth.room!.code}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      booth.setError(
        'Could not copy automatically. Select and copy the invitation below.',
      );
    }
  };
  async function exportPhoto(print = false, save = false) {
    if (!allDone || !approved) return;
    setExporting(true);
    setNotice('');
    try {
      const canvas = await renderBooth(booth.shots, booth.design, booth.solo);
      const blob = await canvasBlob(
        print ? await printSheet(canvas, booth.design.layout) : canvas,
      );
      if (save) {
        await saveKeepsake({
          kind: 'photostrip',
          title: booth.design.caption || 'Our photobooth date',
          file: blob,
          activityPath: '/photobooth',
          caption: booth.design.caption,
          metadata: {
            layout: booth.design.layout,
            paired: !booth.solo,
            date: booth.design.date,
          },
        });
        setNotice('Saved to Our Space.');
      } else {
        downloadBlob(
          blob,
          `dearly-us-${print ? '4x6-print-sheet' : booth.design.layout}-${booth.design.date}.png`,
        );
        setNotice(
          print
            ? 'Print at 4 × 6 inches, actual size, with scaling turned off.'
            : 'Your keepsake is ready.',
        );
      }
    } catch (e) {
      booth.setError(
        e instanceof Error ? e.message : 'Export failed. Please try again.',
      );
    } finally {
      setExporting(false);
    }
  }
  function addSticker(text: string) {
    if (booth.design.stickers.length >= 16) return;
    const id = crypto.randomUUID();
    setStickerId(id);
    patch({
      stickers: [
        ...booth.design.stickers,
        { id, text, x: 0.5, y: 0.2, size: 28, rotation: -8 },
      ],
    });
  }
  function changeSticker(change: Record<string, number>) {
    patch({
      stickers: booth.design.stickers.map((s) =>
        s.id === stickerId ? { ...s, ...change } : s,
      ),
    });
  }
  const drawSize = logicalSize(booth.design.layout);
  const drawPath = (points: DrawPoint[]) =>
    pointsToBezierPath(
      points.map((point) => ({
        x: point.x * drawSize.width,
        y: point.y * drawSize.height,
      })),
    );
  const pointerPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };
  const beginDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!mayEdit) return;
    const point = pointerPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (eraser) {
      const strokes = booth.design.strokes.filter(
        (stroke) =>
          !stroke.points.some(
            (candidate) =>
              Math.hypot(candidate.x - point.x, candidate.y - point.y) < 0.035,
          ),
      );
      if (strokes.length !== booth.design.strokes.length) patch({ strokes });
      return;
    }
    setDrawing([point]);
  };
  const continueDrawing = (event: React.PointerEvent<SVGSVGElement>) => {
    if (
      !drawing.length ||
      eraser ||
      !event.currentTarget.hasPointerCapture(event.pointerId)
    )
      return;
    const point = pointerPoint(event),
      last = drawing.at(-1)!;
    if (Math.hypot(last.x - point.x, last.y - point.y) > 0.003)
      setDrawing((current) => [...current, point].slice(-240));
  };
  const finishDrawing = () => {
    if (drawing.length > 1) {
      const stroke = {
        id: crypto.randomUUID(),
        color: drawColor,
        width: drawWidth,
        points: simplifyStroke(drawing),
      };
      patch({ strokes: [...booth.design.strokes.slice(-31), stroke] });
    }
    setDrawing([]);
  };
  return (
    <div className="photo-studio">
      <header className="studio-header">
        <Link href="/" aria-label="Dearly Us home">
          <BrandLogo />
        </Link>
        <span>THE LONG-DISTANCE PHOTO CLUB</span>
        <Link href="/activity">
          <ArrowLeft size={15} /> All activities
        </Link>
      </header>
      <main className="studio-main">
        {step === 0 ? (
          <section className="booth-entrance">
            <div>
              <span className="studio-eyebrow">
                A BOOTH BIG ENOUGH FOR BOTH YOUR WORLDS
              </span>
              <h1>
                Two places.
                <br />
                One little <em>memory.</em>
              </h1>
              <p>
                Get in the frame with your favourite person.
                <br />
                Four poses, one shared countdown, a strip to keep.
              </p>
              <div className="entrance-actions">
                <button
                  className="studio-primary"
                  disabled={!ready || booth.busy}
                  onClick={() => void booth.enter()}
                >
                  <Users size={18} />{' '}
                  {booth.busy ? 'Opening your booth…' : 'Create a booth'}
                  <ArrowRight size={18} />
                </button>
                <button
                  className="studio-text-button"
                  disabled={!ready}
                  onClick={() => booth.enterSolo()}
                >
                  Try the solo booth
                </button>
              </div>
              <div className="studio-join">
                <label htmlFor="booth-code">Have an invitation?</label>
                <div>
                  <input
                    id="booth-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={24}
                    placeholder="Enter booth code"
                    autoComplete="off"
                  />
                  <button
                    disabled={!code.trim() || booth.busy}
                    onClick={() => void booth.enter(code)}
                  >
                    Join <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <p className="studio-small">
                Two signed-in people. No couple profile required.{' '}
                <Link
                  href={`/login?next=${encodeURIComponent(`/photobooth${code ? `?room=${code}` : ''}`)}`}
                >
                  Sign in
                </Link>
              </p>
            </div>
            <div className="entrance-machine" aria-hidden="true">
              <div className="machine-label">
                DEARLY US PHOTO CLUB <span>01</span>
              </div>
              <div className="machine-curtain">
                <div className="machine-photo">
                  <img src="/photos/frame1.webp" alt="" />
                  <img src="/photos/frame2.webp" alt="" />
                  <span>meet me in the middle.</span>
                </div>
                <Heart className="machine-heart" size={40} strokeWidth={1} />
              </div>
              <div className="machine-slot" />
              <span className="machine-note">
                a little closer, in four frames.
              </span>
            </div>
          </section>
        ) : (
          <>
            <div className="studio-title">
              <div>
                <span className="studio-eyebrow">
                  {booth.solo
                    ? 'YOUR OWN LITTLE PHOTO DATE'
                    : 'TWO PLACES. ONE PHOTO BOOTH.'}
                </span>
                <h1>
                  {step < 3
                    ? 'Meet me in the frame.'
                    : step === 3
                      ? 'Make it feel like us.'
                      : 'A little moment, forever.'}
                </h1>
              </div>
              <button
                className="studio-text-button"
                onClick={() => {
                  if (
                    booth.shots.some((s) => s.left || s.right) &&
                    !confirm(
                      'Leave this booth? Unsaved photos on this device will be lost.',
                    )
                  )
                    return;
                  void booth.leave();
                  setStep(0);
                }}
              >
                Leave booth <X size={14} />
              </button>
            </div>
            <nav className="studio-steps" aria-label="Photobooth progress">
              {steps.slice(1).map((label, i) => (
                <button
                  key={label}
                  aria-current={step === i + 1 ? 'step' : undefined}
                  disabled={booth.shooting || (i + 1 >= 3 && !allDone)}
                  onClick={() => setStep(i + 1)}
                >
                  <span>{i + 1}</span>
                  {label}
                </button>
              ))}
              <span
                className={`studio-connection ${booth.online ? 'online' : ''}`}
              >
                {booth.solo
                  ? 'Solo session'
                  : booth.online
                    ? 'Partner in the booth'
                    : 'Waiting for your person'}
              </span>
            </nav>
            <div className="studio-workspace">
              <section className="studio-console">
                {step <= 2 && (
                  <>
                    {!booth.solo && (
                      <div className="studio-invite">
                        <div>
                          <strong>Your private booth</strong>
                          <span>{booth.room?.code}</span>
                        </div>
                        <button onClick={() => void copy()}>
                          <Copy size={14} />
                          {copied ? 'Copied' : 'Copy invite'}
                        </button>
                      </div>
                    )}
                    <div
                      className="studio-machine-status"
                      aria-label="Booth status"
                    >
                      <span className={booth.stream ? 'ready' : ''}>
                        <i /> Camera {booth.stream ? 'ready' : 'waiting'}
                      </span>
                      <span
                        className={booth.solo || booth.online ? 'ready' : ''}
                      >
                        <i />{' '}
                        {booth.solo
                          ? 'Solo booth'
                          : booth.online
                            ? 'Partner present'
                            : 'Partner waiting'}
                      </span>
                      <span
                        className={
                          !rendering && !sceneLoadError
                            ? 'ready'
                            : sceneLoadError
                              ? 'warning'
                              : ''
                        }
                      >
                        <i />{' '}
                        {sceneLoadError
                          ? 'Scene fallback'
                          : rendering
                            ? 'Processing'
                            : 'Background ready'}
                      </span>
                      <span className={!syncing ? 'ready' : ''}>
                        <i />{' '}
                        {syncing ? 'Photos transferring' : 'Transfer ready'}
                      </span>
                    </div>
                    <div className="studio-camera-title">
                      <span>
                        {step === 1
                          ? 'Get comfortable. Check your framing.'
                          : POSES[booth.activeCut]}
                      </span>
                      <small>
                        {step === 2
                          ? `POSE ${booth.activeCut + 1} / 4`
                          : 'CAMERA CHECK'}
                      </small>
                    </div>
                    {!booth.solo && booth.mediaState === 'unavailable' && (
                      <div className="studio-fallback" role="status">
                        <strong>Your private room is still connected.</strong>
                        <span>
                          Live video could not cross this network. Each person
                          can upload four photos below; countdowns, edits, and
                          approvals continue together.
                        </span>
                      </div>
                    )}
                    <div
                      className={`studio-camera ${booth.solo ? 'solo' : ''} ${grid ? 'with-grid' : ''}`}
                    >
                      <div
                        className={`studio-camera-lamp ${booth.stream ? 'on' : ''}`}
                      >
                        <i /> CAMERA READY
                      </div>
                      <div className="studio-feed">
                        <video
                          ref={booth.localVideo}
                          muted
                          playsInline
                          autoPlay
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        {!booth.stream && (
                          <div className="studio-camera-empty">
                            <Camera size={34} strokeWidth={1} />
                            <h3>Your side of the story</h3>
                            <button
                              disabled={booth.cameraBusy}
                              onClick={() => void booth.enableCamera()}
                            >
                              {booth.cameraBusy
                                ? 'Opening camera…'
                                : 'Enable camera'}
                            </button>
                          </div>
                        )}
                        <span>You · {booth.side}</span>
                      </div>
                      {!booth.solo && (
                        <div className="studio-feed">
                          <video ref={remoteVideo} autoPlay playsInline />
                          {!booth.remoteStream && (
                            <div className="studio-camera-empty">
                              <Heart size={34} strokeWidth={1} />
                              <h3>
                                {booth.online
                                  ? 'Your person is here'
                                  : 'A space for your person'}
                              </h3>
                              <p>
                                {booth.online
                                  ? 'Enable cameras for live video. Paired photos can still be exchanged without it.'
                                  : 'Share the invitation to bring them into the booth.'}
                              </p>
                            </div>
                          )}
                          <span>
                            Your person ·{' '}
                            {booth.side === 'left' ? 'right' : 'left'}
                          </span>
                        </div>
                      )}
                      {booth.countdown !== null && (
                        <div
                          className="studio-countdown"
                          role="status"
                          aria-live="off"
                        >
                          {booth.countdown}
                        </div>
                      )}
                      {booth.flash && <div className="studio-flash" />}
                    </div>
                    <div className="studio-tools studio-switch-bank">
                      <button
                        className="machine-toggle"
                        disabled={!booth.stream}
                        aria-pressed={booth.mic}
                        onClick={() => void booth.toggleMic()}
                      >
                        {booth.mic ? <Mic size={15} /> : <MicOff size={15} />}{' '}
                        {booth.mic ? 'Mic on' : 'Mic off'}
                      </button>
                      <button
                        className="machine-toggle"
                        aria-pressed={grid}
                        onClick={() => setGrid(!grid)}
                      >
                        Framing grid
                      </button>
                      <button
                        className="machine-control"
                        disabled={booth.cameraBusy || booth.shooting}
                        onClick={() => void booth.enableCamera()}
                      >
                        <RotateCcw size={14} /> Restart camera
                      </button>
                    </div>
                    {step === 1 ? (
                      <div className="studio-ready">
                        <p>
                          Enabling your camera shares a live preview with the
                          other person in this private booth. Photos are
                          exchanged when you shoot or upload; nothing is saved
                          to Our Space automatically.
                        </p>
                        <div>
                          <button
                            className={booth.ready ? 'studio-selected' : ''}
                            disabled={!booth.stream}
                            onClick={() => void booth.toggleReady()}
                          >
                            <Check size={16} />
                            {booth.ready ? 'You are ready' : 'I’m ready'}
                          </button>
                          {!booth.solo && (
                            <span>
                              {booth.partnerReady
                                ? 'Your person is ready too ♡'
                                : 'Waiting for your person to get ready'}
                            </span>
                          )}
                          <button
                            className="studio-primary"
                            onClick={() => {
                              setStep(2);
                              void booth.prepareFrames();
                            }}
                          >
                            Enter the booth <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="studio-shutter-settings">
                          <div
                            className="studio-timer-dial"
                            aria-label="Countdown delay"
                          >
                            <span>COUNTDOWN</span>
                            {[3, 5].map((seconds) => (
                              <button
                                key={seconds}
                                disabled={booth.shooting}
                                aria-pressed={timer === seconds}
                                onClick={() => setTimer(seconds)}
                              >
                                <strong>{seconds}</strong>
                                <small>SEC</small>
                              </button>
                            ))}
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={automatic}
                              disabled={booth.shooting}
                              onChange={(e) => setAutomatic(e.target.checked)}
                            />{' '}
                            Take all four poses
                          </label>
                        </div>
                        <div className="studio-shutter-row">
                          <button
                            className={booth.ready ? 'studio-selected' : ''}
                            disabled={!booth.stream || booth.shooting}
                            onClick={() => void booth.toggleReady()}
                          >
                            {booth.ready ? '✓ Ready' : 'Get ready'}
                          </button>
                          {booth.shooting ? (
                            <button
                              className="studio-primary"
                              onClick={() => void booth.cancel()}
                            >
                              Pause session
                            </button>
                          ) : (
                            <button
                              className="studio-primary studio-shutter"
                              disabled={
                                !booth.ready ||
                                (!booth.solo &&
                                  (!booth.partnerReady ||
                                    booth.side !== 'left'))
                              }
                              onClick={() =>
                                void booth.begin(
                                  automatic ? 0 : selected,
                                  timer,
                                  automatic,
                                )
                              }
                            >
                              <Camera size={20} />
                              {automatic
                                ? 'Take our four photos'
                                : `Take photo ${selected + 1}`}
                            </button>
                          )}
                        </div>
                        {!booth.solo && booth.side === 'right' && (
                          <p className="studio-small">
                            The host starts the countdown once you are both
                            ready.
                          </p>
                        )}
                      </>
                    )}
                    <div className="studio-cut-list">
                      {Array.from({ length: 4 }, (_, i) => (
                        <button
                          key={i}
                          className={`${selected === i ? 'selected' : ''} ${booth.shots[i] && completeShot(booth.shots[i], booth.solo) ? 'developed' : booth.shots[i] ? 'processing' : 'empty'}`}
                          onClick={() => setSelected(i)}
                          aria-label={`Select photo ${i + 1}`}
                        >
                          <span>{String(i + 1).padStart(2, '0')}</span>
                          <div>
                            {booth.shots[i]?.left ? (
                              <img
                                src={booth.shots[i].left!.src}
                                alt="Your left photo"
                              />
                            ) : (
                              <Camera size={17} />
                            )}{' '}
                            {!booth.solo &&
                              (booth.shots[i]?.right ? (
                                <img
                                  src={booth.shots[i].right!.src}
                                  alt="Your right photo"
                                />
                              ) : (
                                <Heart size={17} />
                              ))}
                          </div>
                          <small>
                            {booth.shots[i] &&
                            completeShot(booth.shots[i], booth.solo)
                              ? 'Paired & ready'
                              : 'Waiting for photo'}
                            {booth.shots[i]?.[booth.side] &&
                              booth.transfers[
                                booth.shots[i][booth.side]!.id
                              ] && (
                                <em>
                                  {' · '}
                                  {
                                    booth.transfers[
                                      booth.shots[i][booth.side]!.id
                                    ].state
                                  }
                                </em>
                              )}
                          </small>
                        </button>
                      ))}
                    </div>
                    <div className="studio-tools">
                      <button
                        disabled={booth.busy || booth.shooting}
                        onClick={() => uploadInput.current?.click()}
                      >
                        <Upload size={15} /> Upload your photo {selected + 1}
                      </button>
                      {!booth.solo && (
                        <button
                          disabled={booth.busy || !booth.online}
                          onClick={() => void booth.resend()}
                        >
                          Resend photos
                        </button>
                      )}
                      <button
                        disabled={!allDone || booth.shooting}
                        onClick={() => setStep(3)}
                      >
                        Review & decorate <ArrowRight size={15} />
                      </button>
                    </div>
                    <input
                      ref={uploadInput}
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void booth.upload(file, selected);
                        e.target.value = '';
                      }}
                    />
                  </>
                )}
                {step === 3 && (
                  <div className="studio-editor">
                    <div className="editor-heading">
                      <span className="studio-eyebrow">
                        THE FINISHING TOUCHES
                      </span>
                      <h2>A frame that feels like you.</h2>
                      <p>
                        {booth.solo
                          ? 'Your photo, your finishing touches.'
                          : mayEdit
                            ? 'You control the shared design. Your partner sees each change.'
                            : 'Your partner is decorating. You can still adjust your own crops.'}
                      </p>
                      {!booth.solo && (
                        <button
                          onClick={() => void booth.passEditor()}
                          disabled={booth.side === 'right' && !mayEdit}
                        >
                          {booth.side === 'left'
                            ? mayEdit
                              ? 'Pass editing to your person'
                              : 'Take editing back'
                            : 'Return editing to host'}
                        </button>
                      )}
                    </div>
                    <fieldset disabled={!mayEdit}>
                      <legend>01 · Choose your print</legend>
                      <div className="studio-options">
                        {(['strip', 'grid'] as const).map((layout) => (
                          <button
                            key={layout}
                            aria-pressed={booth.design.layout === layout}
                            onClick={() => patch({ layout })}
                          >
                            {layout === 'strip'
                              ? 'Classic four-cut strip'
                              : 'Four-frame postcard'}
                          </button>
                        ))}
                      </div>
                      <div className="studio-swatches">
                        {Object.entries(THEMES).map(([theme, colors]) => (
                          <button
                            key={theme}
                            style={{
                              background: colors.paper,
                              color: colors.ink,
                            }}
                            aria-pressed={booth.design.theme === theme}
                            onClick={() =>
                              patch({ theme: theme as BoothDesign['theme'] })
                            }
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset disabled={!mayEdit}>
                      <legend>02 · Pick the feeling</legend>
                      <div className="studio-composition-heading">
                        <div>
                          <strong>Shared scene book</strong>
                          <p>
                            We remove both backgrounds on this device and
                            compose you into one room.
                          </p>
                        </div>
                        <span
                          className="studio-removal-switch"
                          aria-label="Background removal status"
                        >
                          <i
                            className={
                              booth.design.composition === 'backdrop'
                                ? 'on'
                                : ''
                            }
                          />
                          {booth.design.composition === 'backdrop'
                            ? 'REMOVAL ON'
                            : 'ORIGINALS ON'}
                        </span>
                      </div>
                      {booth.design.composition === 'backdrop' && (
                        <>
                          {sceneLoadError && (
                            <div className="studio-scene-error" role="alert">
                              <span>
                                The photograph could not load, so the booth is
                                using its matching fallback colour.
                              </span>
                              <button
                                onClick={() =>
                                  setSceneRetry((value) => value + 1)
                                }
                              >
                                Retry scene
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      <div className="studio-scene-book">
                        {Object.values(BACKDROPS).map((scene, index) => (
                          <button
                            key={scene.id}
                            className="studio-scene-card"
                            aria-label={`${scene.name} shared background`}
                            aria-pressed={
                              booth.design.composition === 'backdrop' &&
                              selectedScene.id === scene.id
                            }
                            onClick={() =>
                              patch({
                                composition: 'backdrop',
                                backdrop: scene.id,
                              })
                            }
                          >
                            <span className="scene-number">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <img src={scene.thumbnail} alt="" loading="lazy" />
                            <span className="scene-copy">
                              <strong>{scene.name}</strong>
                              <small>{scene.description}</small>
                            </span>
                            <Check
                              className="scene-check"
                              size={16}
                              aria-hidden="true"
                            />
                          </button>
                        ))}
                        <button
                          className="studio-scene-card original"
                          aria-label="Keep both original photo backgrounds"
                          aria-pressed={booth.design.composition === 'split'}
                          onClick={() => patch({ composition: 'split' })}
                        >
                          <span className="scene-number">11</span>
                          <span className="scene-original-preview">
                            <Users size={28} />
                          </span>
                          <span className="scene-copy">
                            <strong>Original Backgrounds</strong>
                            <small>
                              Keep each room exactly as it was photographed.
                            </small>
                          </span>
                          <Check
                            className="scene-check"
                            size={16}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                      <p className="studio-processing-note">
                        Free on-device processing. Refined cutouts are cached
                        while you try scenes; originals stay intact.
                      </p>
                      {booth.design.composition === 'backdrop' && (
                        <div className={`studio-cutout-quality studio-cutout-quality--${processing.quality?.status ?? (rendering ? 'working' : 'good')}`} role="status">
                          <span className="studio-cutout-quality__lamp" aria-hidden="true" />
                          <div>
                            <strong>
                              {rendering
                                ? processing.stage === 'loading'
                                  ? 'Loading your photographs'
                                  : processing.stage === 'finding'
                                    ? 'Finding both people'
                                    : processing.stage === 'cleaning'
                                      ? 'Cleaning portrait edges'
                                      : 'Matching the selected scene'
                                : processing.quality?.status === 'fair'
                                  ? 'Cutout ready — check the edges'
                                  : 'Refined cutout ready'}
                            </strong>
                            <small>
                              {rendering && processing.total
                                ? `${processing.completed} of ${processing.total} portraits refined`
                                : 'Hair, hands and clothing edges have been cleaned for export.'}
                            </small>
                          </div>
                          <button type="button" disabled={rendering} onClick={retryCutouts}>
                            Refine again
                          </button>
                        </div>
                      )}
                      <div className="studio-options">
                        {Object.keys(FILTERS).map((filter) => (
                          <button
                            key={filter}
                            aria-pressed={booth.design.filter === filter}
                            onClick={() =>
                              patch({ filter: filter as BoothDesign['filter'] })
                            }
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend>03 · Your framing</legend>
                      <label>
                        Photo{' '}
                        <select
                          value={selected}
                          onChange={(e) => setSelected(Number(e.target.value))}
                        >
                          {[0, 1, 2, 3].map((i) => (
                            <option key={i} value={i}>
                              Photo {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                      {myPhoto && (
                        <>
                          <label>
                            Zoom
                            <input
                              aria-label="Your photo zoom"
                              type="range"
                              min="1"
                              max="2.5"
                              step=".05"
                              value={myPhoto.crop.zoom}
                              onChange={(e) =>
                                void booth.updateCrop(selected, {
                                  ...myPhoto.crop,
                                  zoom: Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <label>
                            Left / right
                            <input
                              aria-label="Your horizontal crop"
                              type="range"
                              min="-1"
                              max="1"
                              step=".05"
                              value={myPhoto.crop.x}
                              onChange={(e) =>
                                void booth.updateCrop(selected, {
                                  ...myPhoto.crop,
                                  x: Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <label>
                            Up / down
                            <input
                              aria-label="Your vertical crop"
                              type="range"
                              min="-1"
                              max="1"
                              step=".05"
                              value={myPhoto.crop.y}
                              onChange={(e) =>
                                void booth.updateCrop(selected, {
                                  ...myPhoto.crop,
                                  y: Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <div className="studio-tools">
                            <button
                              onClick={() =>
                                void booth.updateCrop(selected, {
                                  ...myPhoto.crop,
                                  mirror: !myPhoto.crop.mirror,
                                })
                              }
                            >
                              Mirror your photo
                            </button>
                            <button
                              onClick={() =>
                                void booth.updateCrop(selected, DEFAULT_CROP)
                              }
                            >
                              Reset crop
                            </button>
                            {booth.design.composition === 'backdrop' && (
                              <button
                                aria-expanded={refiningEdges}
                                onClick={() => setRefiningEdges((value) => !value)}
                              >
                                Refine cutout edges
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setAutomatic(false);
                                setStep(2);
                              }}
                            >
                              Retake this pair
                            </button>
                          </div>
                          {refiningEdges && booth.design.composition === 'backdrop' && (
                            <div className="studio-cutout-refiner">
                              <div className="studio-cutout-refiner__heading">
                                <div>
                                  <strong>Edge correction · Photo {selected + 1}</strong>
                                  <small>Paint only where the automatic cutout needs help.</small>
                                </div>
                                <button onClick={() => setRefiningEdges(false)}>Done</button>
                              </div>
                              <div className="studio-cutout-refiner__tools">
                                <button aria-pressed={refineMode === 'erase'} onClick={() => setRefineMode('erase')}>Erase background</button>
                                <button aria-pressed={refineMode === 'restore'} onClick={() => setRefineMode('restore')}>Restore person</button>
                                <label>
                                  Brush
                                  <input type="range" min="12" max="72" value={refineBrush} onChange={(event) => setRefineBrush(Number(event.target.value))} />
                                </label>
                                <button onClick={async () => {
                                  if (!myPhoto) return;
                                  await undoCutoutEdit(myPhoto.src);
                                  setCutoutRetry((value) => value + 1);
                                }}><RotateCcw size={13} /> Undo</button>
                                <button onClick={async () => {
                                  if (!myPhoto) return;
                                  await resetCutoutEdits(myPhoto.src);
                                  setCutoutRetry((value) => value + 1);
                                }}>Reset automatic cutout</button>
                              </div>
                              <div className="studio-cutout-refiner__canvas-wrap">
                                <canvas
                                  ref={refineCanvas}
                                  aria-label={`Refine background removal for photo ${selected + 1}`}
                                  onPointerDown={(event) => {
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                    refineStroke.current = [refinerPoint(event)];
                                  }}
                                  onPointerMove={(event) => {
                                    if (refineStroke.current.length) refineStroke.current.push(refinerPoint(event));
                                  }}
                                  onPointerUp={(event) => void finishRefineStroke(event)}
                                  onPointerCancel={() => { refineStroke.current = []; }}
                                />
                              </div>
                              <p>Tip: use a smaller brush around hair, glasses, fingers and headphones.</p>
                            </div>
                          )}
                        </>
                      )}
                    </fieldset>
                    <fieldset disabled={!mayEdit}>
                      <legend>04 · A little note</legend>
                      <label>
                        Caption
                        <input
                          value={booth.design.caption}
                          maxLength={60}
                          onChange={(e) => patch({ caption: e.target.value })}
                        />
                      </label>
                      <label>
                        Date
                        <input
                          type="date"
                          value={booth.design.date}
                          onChange={(e) => patch({ date: e.target.value })}
                        />
                      </label>
                    </fieldset>
                    <fieldset disabled={!mayEdit}>
                      <legend>05 · Sticker desk</legend>
                      <div className="studio-stickers">
                        {STICKERS.map((text) => (
                          <button key={text} onClick={() => addSticker(text)}>
                            {text}
                          </button>
                        ))}
                      </div>
                      {booth.design.stickers.length > 0 && (
                        <label>
                          Selected sticker
                          <select
                            value={stickerId}
                            onChange={(e) => setStickerId(e.target.value)}
                          >
                            <option value="">Choose a sticker</option>
                            {booth.design.stickers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.text}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {sticker && (
                        <>
                          <label>
                            Across
                            <input
                              type="range"
                              min=".04"
                              max=".96"
                              step=".01"
                              value={sticker.x}
                              onChange={(e) =>
                                changeSticker({ x: Number(e.target.value) })
                              }
                            />
                          </label>
                          <label>
                            Down
                            <input
                              type="range"
                              min=".06"
                              max=".96"
                              step=".01"
                              value={sticker.y}
                              onChange={(e) =>
                                changeSticker({ y: Number(e.target.value) })
                              }
                            />
                          </label>
                          <label>
                            Size
                            <input
                              type="range"
                              min="14"
                              max="70"
                              value={sticker.size}
                              onChange={(e) =>
                                changeSticker({ size: Number(e.target.value) })
                              }
                            />
                          </label>
                          <label>
                            Rotation
                            <input
                              type="range"
                              min="-45"
                              max="45"
                              value={sticker.rotation}
                              onChange={(e) =>
                                changeSticker({
                                  rotation: Number(e.target.value),
                                })
                              }
                            />
                          </label>
                          <button
                            onClick={() => {
                              patch({
                                stickers: booth.design.stickers.filter(
                                  (s) => s.id !== stickerId,
                                ),
                              });
                              setStickerId('');
                            }}
                          >
                            Remove sticker
                          </button>
                        </>
                      )}
                      {(booth.solo || booth.side === 'left') && (
                        <button onClick={() => booth.undo()}>
                          <RotateCcw size={14} /> Undo design change
                        </button>
                      )}
                    </fieldset>
                    <fieldset disabled={!mayEdit}>
                      <legend>06 · Draw together</legend>
                      <p>
                        Add a handwritten note or tiny doodle directly on the
                        finished print.
                      </p>
                      <div className="studio-drawing-tools">
                        {[
                          '#493039',
                          '#8f5361',
                          '#c38278',
                          '#66715e',
                          '#fff8eb',
                        ].map((color) => (
                          <button
                            key={color}
                            className="studio-drawing-color"
                            style={{ background: color }}
                            aria-label={`Use ${color} ink`}
                            aria-pressed={!eraser && drawColor === color}
                            onClick={() => {
                              setDrawColor(color);
                              setEraser(false);
                            }}
                          />
                        ))}
                        <label>
                          Pen size
                          <input
                            type="range"
                            min="3"
                            max="22"
                            value={drawWidth}
                            onChange={(event) =>
                              setDrawWidth(Number(event.target.value))
                            }
                          />
                        </label>
                        <button
                          aria-pressed={!eraser}
                          onClick={() => setEraser(false)}
                        >
                          <PenLine size={14} /> Pen
                        </button>
                        <button
                          aria-pressed={eraser}
                          onClick={() => setEraser(true)}
                        >
                          Eraser
                        </button>
                        <button
                          disabled={!booth.design.strokes.length}
                          onClick={() =>
                            patch({
                              strokes: booth.design.strokes.slice(0, -1),
                            })
                          }
                        >
                          <RotateCcw size={14} /> Undo stroke
                        </button>
                        <button
                          disabled={!booth.design.strokes.length}
                          onClick={() => patch({ strokes: [] })}
                        >
                          <Trash2 size={14} /> Clear drawing
                        </button>
                      </div>
                      <div
                        className={`studio-drawing-paper ${booth.design.layout}`}
                        style={{ background: THEMES[booth.design.theme].paper }}
                      >
                        {preview && (
                          <img
                            src={preview}
                            alt="Your photobooth print drawing canvas"
                          />
                        )}
                        <svg
                          viewBox={`0 0 ${drawSize.width} ${drawSize.height}`}
                          role="img"
                          aria-label="Draw on your photobooth print"
                          onPointerDown={beginDrawing}
                          onPointerMove={continueDrawing}
                          onPointerUp={finishDrawing}
                          onPointerCancel={() => setDrawing([])}
                        >
                          {drawing.length > 1 && (
                            <path
                              d={drawPath(drawing)}
                              stroke={drawColor}
                              strokeWidth={drawWidth}
                            />
                          )}
                        </svg>
                      </div>
                    </fieldset>
                    <button
                      className="studio-primary"
                      onClick={() => setStep(4)}
                    >
                      Ready to keep it <ArrowRight size={17} />
                    </button>
                  </div>
                )}
                {step === 4 && (
                  <div className="studio-finish">
                    <div className="studio-finish-seal">
                      <Heart size={37} strokeWidth={1} />
                    </div>
                    <span className="studio-eyebrow">
                      THE KIND OF MOMENT YOU KEEP
                    </span>
                    <h2>
                      From our booth,
                      <br />
                      with love.
                    </h2>
                    <p>
                      Four little moments from two different places.
                      <br />
                      One keepsake that belongs to you both.
                    </p>
                    {!booth.solo && (
                      <div className="studio-approval">
                        <p>
                          {approved
                            ? 'Both of you approved this version.'
                            : 'Both people approve the final version before downloading.'}
                        </p>
                        <button
                          className="studio-selected"
                          disabled={
                            rendering ||
                            Boolean(renderError) ||
                            booth.approved.includes(booth.side)
                          }
                          onClick={() => void booth.approve()}
                        >
                          <Check size={15} />
                          {booth.approved.includes(booth.side)
                            ? 'You approved'
                            : 'I love this version'}
                        </button>
                      </div>
                    )}
                    <button
                      className="studio-primary"
                      disabled={
                        rendering ||
                        Boolean(renderError) ||
                        !allDone ||
                        !approved ||
                        syncing ||
                        exporting
                      }
                      onClick={() => void exportPhoto()}
                    >
                      <Download size={18} />
                      {exporting
                        ? 'Preparing your keepsake…'
                        : 'Download our photo'}
                    </button>
                    <button
                      disabled={
                        rendering ||
                        Boolean(renderError) ||
                        !approved ||
                        syncing ||
                        exporting
                      }
                      onClick={() => void exportPhoto(true)}
                    >
                      Download 4 × 6 print sheet
                    </button>
                    {canSaveKeepsake ? (
                      <button
                        disabled={
                          rendering ||
                          Boolean(renderError) ||
                          !approved ||
                          syncing ||
                          exporting ||
                          saving
                        }
                        onClick={() => void exportPhoto(false, true)}
                      >
                        Save to Our Space
                      </button>
                    ) : (
                      <p className="studio-small">
                        Direct download is ready. Connect an Our Space later if
                        you also want a private shared copy.
                      </p>
                    )}
                    <p className="studio-small">
                      PNG ·{' '}
                      {booth.design.layout === 'strip'
                        ? '1200 × 3600'
                        : '2400 × 1800'}{' '}
                      pixels
                      <br />
                      Print sheet: 1200 × 1800 pixels at 4 × 6 inches.
                    </p>
                    <button
                      className="studio-text-button"
                      onClick={() => setStep(3)}
                    >
                      One more finishing touch
                    </button>
                    {notice && <p role="status">{notice}</p>}
                  </div>
                )}
              </section>
              <aside className="studio-print">
                <span className="studio-eyebrow">YOUR LITTLE KEEPSAKE</span>
                <div className="studio-output-slot" aria-hidden="true">
                  <span>PRINT DELIVERY</span>
                </div>
                <div className="studio-paper-tray">
                  <div
                    className={`studio-print-paper ${booth.design.layout === 'grid' ? 'postcard' : ''}`}
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview of your finished photobooth keepsake"
                      />
                    ) : (
                      <p>Developing your preview…</p>
                    )}
                  </div>
                </div>
                <p>
                  {
                    booth.shots.filter((s) => completeShot(s, booth.solo))
                      .length
                  }{' '}
                  / 4 {booth.solo ? 'photos' : 'paired moments'}
                  <br />
                  <em>Same composition in preview and print.</em>
                </p>
                {rendering && (
                  <p role="status">
                    {booth.design.composition === 'backdrop'
                      ? 'Preparing your shared backdrop…'
                      : 'Updating your preview…'}
                  </p>
                )}
                {renderError && (
                  <div className="studio-render-recovery" role="alert">
                    <p>{renderError}</p>
                    <div>
                      <button onClick={retryCutouts}>Try removal again</button>
                      <button onClick={() => patch({ composition: 'split' })}>Use original backgrounds</button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
        {booth.error && (
          <div className="studio-error" role="alert">
            <span>{booth.error}</span>
            <button
              aria-label="Dismiss message"
              onClick={() => booth.setError('')}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <footer className="studio-footer">
          made for the moments that belong to you two. <Heart size={12} />
        </footer>
      </main>
    </div>
  );
}
