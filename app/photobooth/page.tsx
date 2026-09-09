'use client';

import { BrandLogo } from '@/components/shared/BrandLogo';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ROOM_STYLES,
  PHOTO_LAYOUTS as LAYOUTS,
  POSE_PROMPTS,
  AR_FILTERS,
  COLOR_FILTERS,
  STICKER_PALETTE,
} from '@/lib/constants';
import { sounds } from '@/lib/sound';
import { downloadAnimatedStripVideo } from '@/lib/gif-recorder';
import { Confetti } from '@/components/shared/Confetti';
import { Ribbon } from '@/components/shared/Ribbon';
import { TiltedCard, ShinyText } from '@/components/ui';
import { RoomInviteModal } from '@/components/shared/RoomInviteModal';
import { CoupleNameBar } from '@/components/shared/CoupleNameBar';
import { CupidotActivityGuidance } from '@/components/shared/CupidotActivityGuidance';
import {
  getCupidotPoseIdea,
  generateCupidotCaption,
  PoseIdea,
} from '@/lib/cupidot';
import { useCoupleProfile } from '@/lib/couple';
import { useActivityRuntime } from '@/hooks/useActivityRuntime';

export interface PlacedSticker {
  id: string;
  content: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  rotation: number; // degrees (-30 to +30)
  scale: number; // 0.8 - 1.5
  isHangul?: boolean;
  flipX?: boolean;
}

export interface CutTransform {
  rotation: number; // 0, 90, 180, 270
  flipX: boolean;
}

import { pointsToBezierPath } from '@/lib/photobooth-bezier';
export { pointsToBezierPath };


const STICKER_CATEGORIES = [
  {
    id: 'hangul',
    name: '🇰🇷 Korean Text',
    items: [
      { text: '사랑해', label: 'I Love You', isHangul: true },
      { text: '인생네컷', label: 'Life4Cuts', isHangul: true },
      { text: '우리둘이', label: 'Just Us Two', isHangul: true },
      { text: '영원히', label: 'Forever', isHangul: true },
      { text: '보고싶어', label: 'Miss You', isHangul: true },
      { text: '뽀뽀', label: 'Kisses', isHangul: true },
      { text: '최고야', label: 'You Are Best', isHangul: true },
      { text: '행복해', label: 'Happy', isHangul: true },
    ],
  },
  {
    id: 'props',
    name: '🎀 Cute Props',
    items: [
      { text: '🐱', label: 'Cat Ears' },
      { text: '🐰', label: 'Bunny' },
      { text: '👼', label: 'Angel' },
      { text: '🌸', label: 'Blush' },
      { text: '💖', label: 'Heart' },
      { text: '🎀', label: 'Ribbon' },
      { text: '🧸', label: 'Teddy' },
      { text: '👑', label: 'Crown' },
      { text: '🕶️', label: 'Retro Shades' },
      { text: '🍓', label: 'Strawberry' },
    ],
  },
  {
    id: 'sparkles',
    name: '✨ Sparkles & Stars',
    items: [
      { text: '✨', label: 'Sparkles' },
      { text: '💫', label: 'Dizzy Star' },
      { text: '🌟', label: 'Glowing Star' },
      { text: '🪄', label: 'Magic Wand' },
      { text: '⭐', label: 'Star' },
      { text: '🫧', label: 'Bubbles' },
    ],
  },
];

export default function PhotoboothPage() {
  // Navigation & Scene state: START | ROOM | PROFILE | LAYOUT | THEME | BOOTH | EDIT | FILTER | DECORATE | DOWNLOAD
  const [scene, setScene] = useState<
    | 'START'
    | 'ROOM'
    | 'PROFILE'
    | 'LAYOUT'
    | 'THEME'
    | 'BOOTH'
    | 'EDIT'
    | 'FILTER'
    | 'DECORATE'
    | 'DOWNLOAD'
  >('BOOTH');

  // Room config
  const [roomCode, setRoomCode] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(ROOM_STYLES[0]);
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(false);
  const {
    partnerA,
    partnerB,
    cityA,
    cityB,
    roomCode: savedRoomCode,
  } = useCoupleProfile();
  const activityRuntime = useActivityRuntime({
    sessionId: `mock-photobooth-${savedRoomCode || 'local'}`,
    activityType: 'photobooth',
    roomId: savedRoomCode || 'local',
    transportMode: 'mock',
    initialOptions: { filter: COLOR_FILTERS[0].id, frameStyle: LAYOUTS[0].id },
  });
  const [nickname, setNickname] = useState(partnerA);
  const [partnerName, setPartnerName] = useState(partnerB);
  const [coupleName, setCoupleName] = useState(`${partnerA} ♡ ${partnerB}`);
  const [micMuted, setMicMuted] = useState(false);

  useEffect(() => {
    setNickname(partnerA);
    setPartnerName(partnerB);
    setCoupleName(`${partnerA} ♡ ${partnerB}`);
  }, [partnerA, partnerB]);

  useEffect(() => {
    if (savedRoomCode) setRoomCode(savedRoomCode);
  }, [savedRoomCode]);

  // Booth camera & feed state
  const [feedMode, setFeedMode] = useState<'webcam' | 'upload'>('webcam');
  const [currentShotIdx, setCurrentShotIdx] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashing, setFlashing] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [capturedShots, setCapturedShots] = useState<string[]>([
    '/photos/frame1.webp',
    '/photos/frame2.webp',
    '/photos/frame3.webp',
    '/photos/frame4.webp',
  ]);
  const [selectedArFilter, setSelectedArFilter] = useState(AR_FILTERS[0]);
  const [selectedColorFilter, setSelectedColorFilter] = useState(
    COLOR_FILTERS[0],
  );
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([
    {
      id: '1',
      content: '사랑해',
      x: 28,
      y: 18,
      rotation: -6,
      scale: 1,
      isHangul: true,
    },
    { id: '2', content: '✨', x: 74, y: 38, rotation: 12, scale: 1.1 },
    { id: '3', content: '💖', x: 80, y: 84, rotation: 8, scale: 1.2 },
  ]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [activeStickerTab, setActiveStickerTab] = useState<
    'hangul' | 'props' | 'sparkles'
  >('hangul');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Next-Gen Polish: Bezier Doodling, Twin Strip, Drag-Drop & Shutter Freeze
  const [isMotionMode, setIsMotionMode] = useState(false);
  const [motionFrameIdx, setMotionFrameIdx] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [neonPenColor, setNeonPenColor] = useState('#FF7BA3');
  const [doodleBrushWidth, setDoodleBrushWidth] = useState<number>(5); // 2: Fine | 5: Marker | 9: Bold Glow
  const [doodlePaths, setDoodlePaths] = useState<
    { color: string; width: number; points: { x: number; y: number }[] }[]
  >([]);
  const [doodleRedoStack, setDoodleRedoStack] = useState<
    { color: string; width: number; points: { x: number; y: number }[] }[]
  >([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVintageCamMode, setIsVintageCamMode] = useState(false);
  const [cupidotPose, setCupidotPose] = useState<PoseIdea | null>(null);
  const [singleRetakeCutIdx, setSingleRetakeCutIdx] = useState<number | null>(null);
  const [freezeFrame, setFreezeFrame] = useState<string | null>(null);
  const [isTwinStrip, setIsTwinStrip] = useState(false);
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [dragOverCutIdx, setDragOverCutIdx] = useState<number | null>(null);

  // Advanced Functional Controls: Timer, Manual/Auto, Grid, Flash & Sound
  const [timerDuration, setTimerDuration] = useState<3 | 5 | 10>(3);
  const [shootMode, setShootMode] = useState<'auto' | 'manual'>('auto');
  const [showGrid, setShowGrid] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cutTransforms, setCutTransforms] = useState<CutTransform[]>([
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
    { rotation: 0, flipX: false },
  ]);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [filmGrain, setFilmGrain] = useState<boolean>(false);
  const [customFrameColor, setCustomFrameColor] = useState<string | null>(null);

  const playSound = (action: () => void) => {
    if (soundEnabled) action();
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadCutRef = useRef<number | null>(null);
  const captureTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Toggle live webcam when scene === 'BOOTH' and feedMode === 'webcam'
  useEffect(() => {
    let stream: MediaStream | null = null;
    setCameraError(null);

    if (scene === 'BOOTH' && feedMode === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
          },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Webcam permission or device error:', err);
          setCameraError(
            'Camera access was blocked or unavailable. Check browser permissions or upload photos.',
          );
          setFeedMode('upload');
        });
    }

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [scene, feedMode]);

  const clearCaptureTimeouts = () => {
    captureTimeoutsRef.current.forEach(clearTimeout);
    captureTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearCaptureTimeouts();
  }, []);

  // Motion strip looping interval
  useEffect(() => {
    if (!isMotionMode) return;
    const interval = setInterval(() => {
      setMotionFrameIdx((prev) => (prev + 1) % 4);
    }, 650);
    return () => clearInterval(interval);
  }, [isMotionMode]);

  // Keyboard Shortcuts: Space (snap/next), Escape (cancel/deselect), Delete/Backspace (delete sticker), Ctrl+Z/Y (doodle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (scene === 'BOOTH' && !isShooting) {
          if (shootMode === 'manual') {
            triggerSingleCutRetake(currentShotIdx);
          } else {
            startCaptureSequence();
          }
        }
      } else if (e.key === 'Escape') {
        if (isShooting) {
          cancelCaptureSequence();
        } else if (selectedStickerId) {
          setSelectedStickerId(null);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStickerId) {
          removeSticker(selectedStickerId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (doodleRedoStack.length > 0) {
            const next = doodleRedoStack[doodleRedoStack.length - 1];
            setDoodleRedoStack((prev) => prev.slice(0, -1));
            setDoodlePaths((prev) => [...prev, next]);
            playSound(() => sounds.playTick());
          }
        } else {
          if (doodlePaths.length > 0) {
            const last = doodlePaths[doodlePaths.length - 1];
            setDoodleRedoStack((prev) => [...prev, last]);
            setDoodlePaths((prev) => prev.slice(0, -1));
            playSound(() => sounds.playTick());
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (doodleRedoStack.length > 0) {
          const next = doodleRedoStack[doodleRedoStack.length - 1];
          setDoodleRedoStack((prev) => prev.slice(0, -1));
          setDoodlePaths((prev) => [...prev, next]);
          playSound(() => sounds.playTick());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    scene,
    isShooting,
    shootMode,
    currentShotIdx,
    selectedStickerId,
    doodlePaths,
    doodleRedoStack,
    soundEnabled,
  ]);

  // Move / Swap Cuts
  const moveCut = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= 4 || toIdx < 0 || toIdx >= 4 || fromIdx === toIdx) return;
    playSound(() => sounds.playPop());
    setCapturedShots((prev) => {
      const next = [...prev];
      const temp = next[fromIdx];
      next[fromIdx] = next[toIdx];
      next[toIdx] = temp;
      return next;
    });
    setCutTransforms((prev) => {
      const next = [...prev];
      const temp = next[fromIdx];
      next[fromIdx] = next[toIdx];
      next[toIdx] = temp;
      return next;
    });
  };

  // Rotate cut 90 deg clockwise
  const rotateCut = (idx: number) => {
    playSound(() => sounds.playTick());
    setCutTransforms((prev) => {
      const next = [...prev];
      const cur = next[idx] || { rotation: 0, flipX: false };
      next[idx] = { ...cur, rotation: (cur.rotation + 90) % 360 };
      return next;
    });
  };

  // Flip cut horizontally
  const flipCut = (idx: number) => {
    playSound(() => sounds.playTick());
    setCutTransforms((prev) => {
      const next = [...prev];
      const cur = next[idx] || { rotation: 0, flipX: false };
      next[idx] = { ...cur, flipX: !cur.flipX };
      return next;
    });
  };

  // Cancel any active shooting sequence
  const cancelCaptureSequence = () => {
    clearCaptureTimeouts();
    setIsShooting(false);
    setCountdown(null);
    setFlashing(false);
    setFreezeFrame(null);
    setSingleRetakeCutIdx(null);
    playSound(() => sounds.playTick());
  };

  const grabCurrentFrame = (cutIdx: number): string => {
    let shotUrl = `/photos/frame${(cutIdx % 4) + 1}.webp`;
    if (feedMode === 'webcam' && videoRef.current && canvasRef.current) {
      const c = canvasRef.current;
      const ctx = c.getContext('2d');
      if (ctx && videoRef.current.videoWidth > 0) {
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        // Mirrored for natural selfie capture
        ctx.save();
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, c.width, c.height);
        ctx.restore();
        shotUrl = c.toDataURL('image/webp');
      }
    }
    return shotUrl;
  };

  // Unified Countdown and Snap Engine supporting 3s, 5s, 10s and Auto vs Manual
  const triggerSnapForCut = (cutIdx: number, isAutoSequence = false) => {
    if (isShooting) return;
    clearCaptureTimeouts();
    setIsShooting(true);
    setCurrentShotIdx(cutIdx);
    setSingleRetakeCutIdx(isAutoSequence ? null : cutIdx);
    void activityRuntime.sendEvent('photo_start_countdown', { cut: cutIdx + 1 });

    const totalSeconds = timerDuration;
    setCountdown(totalSeconds);
    playSound(() => sounds.playCountdownBeep(false));

    // Schedule countdown ticks
    for (let s = totalSeconds - 1; s >= 1; s--) {
      const delay = (totalSeconds - s) * 900;
      const t = setTimeout(() => {
        setCountdown(s);
        playSound(() => sounds.playCountdownBeep(false));
        void activityRuntime.sendEvent('photo_tick', { seconds: s });
      }, delay);
      captureTimeoutsRef.current.push(t);
    }

    // Schedule snap at end
    const snapDelay = totalSeconds * 900;
    const tSnap = setTimeout(() => {
      setCountdown(null);
      if (flashEnabled) {
        setFlashing(true);
        const tFlash = setTimeout(() => setFlashing(false), 260);
        captureTimeoutsRef.current.push(tFlash);
      }
      playSound(() => {
        sounds.playCountdownBeep(true);
        sounds.playShutter();
      });
      void activityRuntime.sendEvent('photo_shutter', { shot: cutIdx + 1 });

      const shotUrl = grabCurrentFrame(cutIdx);

      setCapturedShots((prev) => {
        const next = [...prev];
        next[cutIdx] = shotUrl;
        return next;
      });

      setFreezeFrame(shotUrl);
      const tFreeze = setTimeout(() => setFreezeFrame(null), 380);
      captureTimeoutsRef.current.push(tFreeze);

      if (isAutoSequence) {
        const nextIdx = cutIdx + 1;
        if (nextIdx >= selectedLayout.cuts) {
          const tFinish = setTimeout(() => {
            setIsShooting(false);
            setFreezeFrame(null);
            setScene('EDIT');
            playSound(() => sounds.playCelebration());
            void activityRuntime.sendEvent('photo_finish', {});
          }, 750);
          captureTimeoutsRef.current.push(tFinish);
        } else {
          const tNext = setTimeout(() => {
            triggerSnapForCut(nextIdx, true);
          }, 950);
          captureTimeoutsRef.current.push(tNext);
        }
      } else {
        // Manual mode: complete single shot
        const tFinish = setTimeout(() => {
          setIsShooting(false);
          setSingleRetakeCutIdx(null);
          setCurrentShotIdx((prev) => (prev + 1) % 4);
          playSound(() => sounds.playPop());
        }, 500);
        captureTimeoutsRef.current.push(tFinish);
      }
    }, snapDelay);

    captureTimeoutsRef.current.push(tSnap);
  };

  const startCaptureSequence = () => {
    triggerSnapForCut(0, shootMode === 'auto');
  };

  const triggerSingleCutRetake = (targetIdx: number) => {
    triggerSnapForCut(targetIdx, false);
  };

  // Custom device photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sounds.playPop();
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;
      if (typeof targetUploadCutRef.current === 'number') {
        const next = [...capturedShots];
        next[targetUploadCutRef.current] = url;
        setCapturedShots(next);
        targetUploadCutRef.current = null;
      } else {
        setCapturedShots((prev) => [
          url,
          prev[1] || url,
          prev[2] || url,
          prev[3] || url,
        ]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Direct Drag & Drop image file onto any cut frame
  const handleDragOverCut = (cutIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverCutIdx !== cutIdx) setDragOverCutIdx(cutIdx);
  };

  const handleDragLeaveCut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCutIdx(null);
  };

  const handleDropOnCut = (cutIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCutIdx(null);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    sounds.playPop();
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;
      setCapturedShots((prev) => {
        const next = [...prev];
        next[cutIdx] = url;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (content: string, isHangul = false) => {
    sounds.playPop();
    const newStk: PlacedSticker = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content,
      x: Math.round(20 + Math.random() * 60),
      y: Math.round(15 + Math.random() * 70),
      rotation: Math.round((Math.random() - 0.5) * 24),
      scale: 1,
      isHangul,
      flipX: false,
    };
    setPlacedStickers((prev) => [...prev.slice(-14), newStk]);
    setSelectedStickerId(newStk.id);
  };

  const updateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const duplicateSticker = (id: string) => {
    const orig = placedStickers.find((s) => s.id === id);
    if (!orig) return;
    sounds.playPop();
    const cloned: PlacedSticker = {
      ...orig,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: Math.min(90, orig.x + 6),
      y: Math.min(92, orig.y + 4),
    };
    setPlacedStickers((prev) => [...prev, cloned]);
    setSelectedStickerId(cloned.id);
  };

  const bringForward = (id: string) => {
    setPlacedStickers((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      playSound(() => sounds.playTick());
      return next;
    });
  };

  const sendBackward = (id: string) => {
    setPlacedStickers((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      playSound(() => sounds.playTick());
      return next;
    });
  };

  const flipStickerHorizontal = (id: string) => {
    sounds.playTick();
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, flipX: !s.flipX } : s)),
    );
  };

  const removeSticker = (id: string) => {
    sounds.playTick();
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(
      typeof window !== 'undefined' ? window.location.href : '',
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Asynchronous High-Resolution 600x1600 (or 1200x1600 Twin Strip) Canvas Engine
  const generateStripCanvas = async (isTwin = false): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = isTwin ? 1200 : 600;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    };

    const loadedImages = await Promise.all(
      capturedShots.map((s) => loadImage(s)),
    );

    const renderStripAt = (offsetX: number) => {
      ctx.save();
      ctx.translate(offsetX, 0);

      // Background
      const activeBg = customFrameColor || selectedStyle.bg;
      if (selectedStyle.foilEffect === 'holographic') {
        const grad = ctx.createLinearGradient(0, 0, 600, 1600);
        grad.addColorStop(0, '#FFD1DC');
        grad.addColorStop(0.25, '#FFE4B5');
        grad.addColorStop(0.5, '#D4F0FF');
        grad.addColorStop(0.75, '#E8D7FF');
        grad.addColorStop(1, '#FFD1DC');
        ctx.fillStyle = grad;
      } else if (selectedStyle.foilEffect === 'chrome') {
        const grad = ctx.createLinearGradient(0, 0, 600, 1600);
        grad.addColorStop(0, '#CBD5E1');
        grad.addColorStop(0.3, '#FFFFFF');
        grad.addColorStop(0.5, '#94A3B8');
        grad.addColorStop(0.7, '#FFFFFF');
        grad.addColorStop(1, '#CBD5E1');
        ctx.fillStyle = grad;
      } else if (selectedStyle.foilEffect === 'matte-foil') {
        ctx.fillStyle = '#101216';
      } else if (activeBg.startsWith('linear')) {
        const grad = ctx.createLinearGradient(0, 0, 0, 1600);
        grad.addColorStop(0, '#FFE4D6');
        grad.addColorStop(1, '#FFD6E8');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = activeBg;
      }
      ctx.fillRect(0, 0, 600, 1600);

      // Border
      ctx.strokeStyle =
        selectedStyle.foilEffect === 'matte-foil'
          ? '#E2E8F0'
          : selectedStyle.border;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(16, 16, 568, 1568);

      // Title
      ctx.fillStyle = selectedStyle.color;
      ctx.font = 'bold 24px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEARLY US · 인생네컷', 300, 62);

      // 4 Photo Frames
      for (let i = 0; i < 4; i++) {
        const y = 85 + i * 348;
        ctx.fillStyle = '#F8F9FB';
        ctx.fillRect(42, y, 516, 320);

        const img = loadedImages[i];
        if (img && img.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(42, y, 516, 320);
          ctx.clip();

          // Apply selected color grading filter, brightness and contrast
          let filterStr =
            selectedColorFilter &&
            selectedColorFilter.filter &&
            selectedColorFilter.filter !== 'none'
              ? selectedColorFilter.filter
              : '';
          if (brightness !== 100) filterStr += ` brightness(${brightness}%)`;
          if (contrast !== 100) filterStr += ` contrast(${contrast}%)`;
          ctx.filter = filterStr.trim() || 'none';

          const centerX = 42 + 516 / 2;
          const centerY = y + 320 / 2;
          ctx.translate(centerX, centerY);

          const t = cutTransforms[i] || { rotation: 0, flipX: false };
          if (t.rotation) {
            ctx.rotate((t.rotation * Math.PI) / 180);
          }
          if (t.flipX) {
            ctx.scale(-1, 1);
          }

          const isRotated90 = t.rotation === 90 || t.rotation === 270;
          const targetW = isRotated90 ? 320 : 516;
          const targetH = isRotated90 ? 516 : 320;
          const imgRatio = img.width / img.height;
          const frameRatio = targetW / targetH;
          let dw = targetW;
          let dh = targetH;
          if (imgRatio > frameRatio) {
            dw = targetH * imgRatio;
          } else {
            dh = targetW / imgRatio;
          }
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
          ctx.filter = 'none';

          // Optional 90s Film Cam light leak & LED date stamp
          if (isVintageCamMode) {
            const leakGrad = ctx.createRadialGradient(
              516 * 0.35,
              -120,
              10,
              516 * 0.35,
              -120,
              240,
            );
            leakGrad.addColorStop(0, 'rgba(255, 120, 50, 0.45)');
            leakGrad.addColorStop(0.4, 'rgba(255, 40, 100, 0.22)');
            leakGrad.addColorStop(1, 'rgba(255, 40, 100, 0)');
            ctx.fillStyle = leakGrad;
            ctx.fillRect(-516 / 2, -320 / 2, 516, 320);

            ctx.save();
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#FF6A00';
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'right';
            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2);
            const mm = now.getMonth() + 1;
            const dd = now.getDate();
            ctx.fillText(`'${yy}  ${mm}  ${dd}`, 516 / 2 - 16, 320 / 2 - 16);
            ctx.restore();
          }

          // Subtle Film Grain
          if (filmGrain) {
            const noiseCanvas = document.createElement('canvas');
            noiseCanvas.width = 120;
            noiseCanvas.height = 120;
            const nCtx = noiseCanvas.getContext('2d');
            if (nCtx) {
              const nImg = nCtx.createImageData(120, 120);
              for (let p = 0; p < nImg.data.length; p += 4) {
                const v = Math.random() * 255;
                nImg.data[p] = v;
                nImg.data[p + 1] = v;
                nImg.data[p + 2] = v;
                nImg.data[p + 3] = 16;
              }
              nCtx.putImageData(nImg, 0, 0);
              ctx.fillStyle = ctx.createPattern(noiseCanvas, 'repeat') || 'transparent';
              ctx.fillRect(-516 / 2, -320 / 2, 516, 320);
            }
          }

          ctx.restore();
        } else {
          ctx.fillStyle = '#8B8E98';
          ctx.font = 'bold 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `0${i + 1} · ${nickname.toUpperCase()} ♡ ${partnerName.toUpperCase()}`,
            300,
            y + 165,
          );
        }

        ctx.strokeStyle = selectedStyle.border;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(42, y, 516, 320);
      }

      // Bake Placed Stickers onto Canvas
      placedStickers.forEach((stk) => {
        ctx.save();
        const px = (stk.x / 100) * 600;
        const py = (stk.y / 100) * 1600;
        ctx.translate(px, py);
        ctx.rotate((stk.rotation * Math.PI) / 180);
        ctx.scale(stk.flipX ? -stk.scale : stk.scale, stk.scale);

        if (stk.isHangul) {
          ctx.font = 'bold 24px Pretendard, sans-serif';
          const txtW = ctx.measureText(stk.content).width;
          const bW = txtW + 28;
          const bH = 38;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 19);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#FF7BA3';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#FF4D80';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stk.content, 0, 1);
        } else {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 4;
          ctx.font = '40px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stk.content, 0, 0);
        }
        ctx.restore();
      });

      // Bake Neon Doodles with Smooth Quadratic Bezier Curves
      if (doodlePaths.length > 0) {
        doodlePaths.forEach((path) => {
          if (path.points.length < 2) return;
          ctx.save();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = (path.width || 5) * 2.2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = path.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();

          if (path.points.length === 2) {
            ctx.moveTo((path.points[0].x / 100) * 600, (path.points[0].y / 100) * 1600);
            ctx.lineTo((path.points[1].x / 100) * 600, (path.points[1].y / 100) * 1600);
          } else {
            ctx.moveTo((path.points[0].x / 100) * 600, (path.points[0].y / 100) * 1600);
            for (let j = 1; j < path.points.length - 1; j++) {
              const curr = path.points[j];
              const next = path.points[j + 1];
              const midX = ((curr.x + next.x) / 2 / 100) * 600;
              const midY = ((curr.y + next.y) / 2 / 100) * 1600;
              ctx.quadraticCurveTo((curr.x / 100) * 600, (curr.y / 100) * 1600, midX, midY);
            }
            const last = path.points[path.points.length - 1];
            ctx.lineTo((last.x / 100) * 600, (last.y / 100) * 1600);
          }

          ctx.stroke();
          ctx.restore();
        });
      }

      // Couple Name & Footer
      ctx.fillStyle = selectedStyle.color;
      ctx.font = 'bold 22px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(coupleName, 300, 1515);

      ctx.font = '13px monospace';
      ctx.fillStyle = '#5B5E68';
      ctx.fillText(
        `ROOM: ${roomCode} · ${new Date().toLocaleDateString()}`,
        300,
        1545,
      );

      ctx.restore();
    };

    renderStripAt(0);

    if (isTwin) {
      renderStripAt(600);

      // Draw dotted cutting line down the center
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(600, 0);
      ctx.lineTo(600, 1600);
      ctx.stroke();

      // Scissor indicator at top
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText('✂ cut here ✂', 600, 36);
      ctx.restore();
    }

    return canvas;
  };

  const downloadHighResStrip = async () => {
    sounds.playTick();
    const canvas = await generateStripCanvas(isTwinStrip);
    if (!canvas) return;

    const a = document.createElement('a');
    a.download = `dearly-us-${isTwinStrip ? 'twin-strip' : 'photostrip'}-${roomCode}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();

    sounds.playCelebration();
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4000);
  };

  const copyStripToClipboard = async () => {
    sounds.playTick();
    const canvas = await generateStripCanvas(isTwinStrip);
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setClipboardCopied(true);
        sounds.playCelebration();
        setTimeout(() => setClipboardCopied(false), 3000);
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write failed, falling back to download:', err);
      downloadHighResStrip();
    }
  };

  return (
    <div
      style={{
        background: 'var(--paper)',
        minHeight: '100vh',
        paddingBottom: '80px',
        color: 'var(--ink)',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Confetti celebration overlay */}
      <Confetti active={confettiActive} />

      {/* Tagline Ribbon */}
      <Ribbon
        text={
          <>
            ♡ Online Photobooth for Long Distance Couples ·{' '}
            <b>인생네컷 Free Studio</b>
          </>
        }
      />

      {/* Top Navbar */}
      <header className="bar">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="Dearly Us Home">
            <BrandLogo tone="light" />
          </Link>

          {/* Scene Step breadcrumb pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                sounds.playPop();
                setIsInviteModalOpen(true);
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--paper-raised)',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Click to invite partner via QR code or WhatsApp"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  display: 'inline-block',
                }}
              ></span>
              ROOM: <b>{roomCode}</b>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--pink)',
                  fontWeight: 700,
                }}
              >
                💌 Invite
              </span>
            </button>

            <Link
              className="btn btn-ghost"
              href="/activity"
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              Activities ▷
            </Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: '32px' }}>
        {/* Cupidot Standard Activity Lifecycle Guidance */}
        <CupidotActivityGuidance
          activityName="Online Photobooth Studio"
          phase={
            scene === 'DOWNLOAD'
              ? 'completed'
              : scene === 'BOOTH' || scene === 'EDIT'
                ? 'private'
                : scene === 'DECORATE' || scene === 'FILTER'
                  ? 'revealed'
                  : 'ready'
          }
          partnerName={partnerB || 'Partner'}
          privacyNote="Webcam feed is strictly client-side and peer-to-peer. No raw video is ever uploaded or stored."
        />

        {/* Studio Scene Stage Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--paper-raised)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '8px 14px',
            marginBottom: '28px',
            overflowX: 'auto',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'START', label: '1. Style & Room' },
              { id: 'ROOM', label: '2. Lobby' },
              { id: 'BOOTH', label: '3. Live Booth 📸' },
              { id: 'EDIT', label: '4. Edit & Cuts' },
              { id: 'FILTER', label: '5. Filters' },
              { id: 'DECORATE', label: '6. Stickers' },
              { id: 'DOWNLOAD', label: '7. Download & Print 🧲' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setScene(s.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border:
                    scene === s.id
                      ? '1.5px solid var(--pink)'
                      : '1px solid transparent',
                  background:
                    scene === s.id ? 'var(--pink-tint)' : 'transparent',
                  color: scene === s.id ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--pink)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {selectedStyle.label} · {selectedLayout.name.split(' ')[0]}
          </span>
        </div>

        {/* =========================================================================
            SCENE 1: START (Create Room, Style Picker, Solo / Group Toggle)
            ========================================================================= */}
        {scene === 'START' && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="eyebrow">Pick Your Experience Room Style</span>
              <h1
                style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px' }}
              >
                Create a <span className="grad">Photobooth Room</span>
              </h1>
              <p
                style={{
                  color: 'var(--ink-soft)',
                  fontSize: '15px',
                  marginTop: '6px',
                }}
              >
                Pick an aesthetic room skin — classic 인생네컷, 1930s automat,
                neon karaoke, or meme recreation.
              </p>
            </div>

            {/* Mode toggles */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                marginBottom: '26px',
                flexWrap: 'wrap',
              }}
            >
              <button
                className={`btn ${!isSoloMode && !isGroupMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsSoloMode(false);
                  setIsGroupMode(false);
                }}
              >
                👫 Couple Room (Duo)
              </button>
              <button
                className={`btn ${isGroupMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsGroupMode(true);
                  setIsSoloMode(false);
                }}
              >
                👥 Group Photobooth (4 People · 2×2)
              </button>
              <button
                className={`btn ${isSoloMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => {
                  setIsSoloMode(true);
                  setIsGroupMode(false);
                }}
              >
                👤 Solo Session
              </button>
            </div>

            {/* Room Style Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              {ROOM_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => {
                    setSelectedStyle(style);
                    setScene('ROOM');
                  }}
                  style={{
                    background: style.bg,
                    color: style.color,
                    border:
                      selectedStyle.id === style.id
                        ? '2px solid var(--pink)'
                        : `1px solid ${style.border}`,
                    borderRadius: '12px',
                    padding: '18px 16px',
                    boxShadow: 'var(--shadow)',
                    cursor: 'pointer',
                    transform:
                      selectedStyle.id === style.id ? 'scale(1.02)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <strong style={{ fontSize: '16px' }}>{style.label}</strong>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: style.accent,
                      }}
                    ></span>
                  </div>
                  <p
                    style={{
                      fontSize: '12.5px',
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}
                  >
                    {style.sub}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: style.accent,
                    }}
                  >
                    Select Room ▷
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 2: ROOM (Lobby, Code Sharing & QR, Partner Status)
            ========================================================================= */}
        {scene === 'ROOM' && (
          <div
            style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center' }}
          >
            <div className="booth-box" style={{ padding: '36px 28px' }}>
              <span className="eyebrow">Room Lobby · 5-Letter Code</span>
              <h2
                style={{ fontSize: '28px', fontWeight: 800, margin: '10px 0' }}
              >
                Share code with your partner
              </h2>
              <p
                style={{
                  color: 'var(--ink-soft)',
                  fontSize: '15px',
                  marginBottom: '24px',
                }}
              >
                Send this 5-letter code to your partner so both screens connect
                into the same photobooth frame.
              </p>

              {/* Big Room Code Cells */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                {roomCode.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{
                      width: '46px',
                      height: '56px',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--paper)',
                      border: '2px solid var(--line)',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '24px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>

              {/* Partner Status Indicators */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  background: 'var(--paper)',
                  padding: '14px 20px',
                  borderRadius: '10px',
                  marginBottom: '26px',
                  border: '1px solid var(--line)',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0a7d4d',
                    }}
                  ></span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>
                    {nickname} ({cityA || 'Local'}) — Ready
                  </span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#0a7d4d',
                    }}
                  ></span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>
                    {partnerName} ({cityB || 'Remote'}) — Connected
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button className="btn btn-ghost" onClick={copyRoomLink}>
                  {copied ? '✓ Link Copied!' : 'Copy Room Link 🔗'}
                </button>
                <button
                  className="btn btn-grad"
                  onClick={() => setScene('BOOTH')}
                  style={{ padding: '12px 28px' }}
                >
                  Enter Photobooth ▷
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 3: BOOTH (The Live Studio Stage with Duo Video, AR, Countdown & Flash)
            ========================================================================= */}
        {scene === 'BOOTH' && (
          <div className="booth-showcase-grid">
            {/* Left: Studio Stage */}
            <div
              className={`booth-box ${selectedStyle.id === 'vintage' ? 'vintage-automat' : ''}`}
            >
              {/* Studio Bar Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className={`btn ${feedMode === 'webcam' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '5px 14px', fontSize: '12px' }}
                    onClick={() => {
                      setFeedMode('webcam');
                      setCameraError(null);
                    }}
                  >
                    📷 Live Camera
                  </button>
                  <button
                    className={`btn ${feedMode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '5px 14px', fontSize: '12px' }}
                    onClick={() => {
                      setFeedMode('upload');
                      targetUploadCutRef.current = null;
                      fileInputRef.current?.click();
                    }}
                  >
                    📁 Upload Photos
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  <div style={{ width: '1px', height: '18px', background: 'var(--line)', margin: '0 4px' }} />

                  {/* Shutter Mode Selector: Auto vs Manual */}
                  <div style={{ display: 'inline-flex', background: 'var(--paper)', borderRadius: '8px', padding: '2px', border: '1px solid var(--line)' }}>
                    <button
                      onClick={() => { playSound(() => sounds.playPop()); setShootMode('auto'); }}
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        background: shootMode === 'auto' ? 'var(--pink)' : 'transparent',
                        color: shootMode === 'auto' ? '#FFFFFF' : 'var(--ink-soft)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ⏱️ Auto 4-Cuts
                    </button>
                    <button
                      onClick={() => { playSound(() => sounds.playPop()); setShootMode('manual'); }}
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        background: shootMode === 'manual' ? 'var(--pink)' : 'transparent',
                        color: shootMode === 'manual' ? '#FFFFFF' : 'var(--ink-soft)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      📸 Manual Snap
                    </button>
                  </div>

                  {/* Countdown Timer Duration (3s / 5s / 10s) */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>Timer:</span>
                    {([3, 5, 10] as const).map((sec) => (
                      <button
                        key={sec}
                        onClick={() => { playSound(() => sounds.playTick()); setTimerDuration(sec); }}
                        style={{
                          padding: '2px 7px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '6px',
                          border: timerDuration === sec ? '1.5px solid var(--pink)' : '1px solid var(--line)',
                          background: timerDuration === sec ? 'var(--pink-tint)' : 'var(--paper)',
                          color: timerDuration === sec ? 'var(--pink)' : 'var(--ink-soft)',
                          cursor: 'pointer',
                        }}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
                >
                  {/* Composition Grid toggle */}
                  <button
                    className={`btn ${showGrid ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setShowGrid(!showGrid)}
                    style={{ padding: '5px 9px', fontSize: '11.5px' }}
                    title="Toggle Rule-of-Thirds Composition Grid"
                  >
                    井 Grid
                  </button>

                  {/* Flash toggle */}
                  <button
                    className={`btn ${flashEnabled ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    style={{ padding: '5px 9px', fontSize: '11.5px' }}
                    title={flashEnabled ? 'Flash Effect Active' : 'Flash Effect Off'}
                  >
                    {flashEnabled ? '⚡ Flash' : '⚡ Off'}
                  </button>

                  {/* Sound FX toggle */}
                  <button
                    className="btn btn-ghost"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{ padding: '5px 9px', fontSize: '11.5px' }}
                    title={soundEnabled ? 'Mute Shutter Sounds' : 'Unmute Shutter Sounds'}
                  >
                    {soundEnabled ? '🔔 Sound' : '🔕 Mute'}
                  </button>

                  {/* Mic toggle */}
                  <button
                    className="btn btn-ghost"
                    onClick={() => setMicMuted(!micMuted)}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    {micMuted ? '🔇 Mic Muted' : '🎙️ Mic Live'}
                  </button>
                </div>
              </div>

              {/* Camera Error Banner */}
              {cameraError && (
                <div
                  style={{
                    background: 'rgba(255, 77, 106, 0.12)',
                    border: '1px solid rgba(255, 77, 106, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#FF4D6A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>⚠️ {cameraError}</span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#FF4D6A' }}
                    onClick={() => {
                      setCameraError(null);
                      setFeedMode('webcam');
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Camera Screen Stage */}
              <div className="booth-cam-stage">
                {/* Rule-of-Thirds Composition Grid Overlay */}
                {showGrid && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      zIndex: 12,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gridTemplateRows: '1fr 1fr 1fr',
                    }}
                  >
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)' }} />
                    <div />
                  </div>
                )}

                {/* Pose Prompt Top Banner */}
                <div
                  className="pose-prompt-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>
                      {POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].icon}
                    </span>
                    <span>
                      {POSE_PROMPTS[currentShotIdx % POSE_PROMPTS.length].text}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      playSound(() => sounds.playPop());
                      setCupidotPose(getCupidotPoseIdea());
                    }}
                    className="btn"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      background: 'rgba(255, 77, 128, 0.15)',
                      color: '#FF4D80',
                      border: '1px solid rgba(255, 77, 128, 0.3)',
                      borderRadius: '999px',
                      cursor: 'pointer',
                    }}
                  >
                    ʚ🤖💘ɞ Pose Coach
                  </button>
                </div>

                {cupidotPose && (
                  <div
                    style={{
                      margin: '6px 0 10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background:
                        'linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 100%)',
                      border: '1.5px solid rgba(255, 77, 128, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(255, 77, 128, 0.12)',
                      animation: 'gl-rise 0.25s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>
                        {cupidotPose.emoji}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: '#FF4D80',
                            textTransform: 'uppercase',
                          }}
                        >
                          CUPIDOT POSE: {cupidotPose.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            color: '#17181C',
                            fontWeight: 600,
                          }}
                        >
                          {cupidotPose.instructions}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCupidotPose(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Live Color Grade Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(14, 16, 22, 0.78)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    zIndex: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: '10.5px',
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}
                  >
                    LIVE GRADE:
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#FF7BA3',
                    }}
                  >
                    {selectedColorFilter.name}
                  </span>
                </div>

                {feedMode === 'webcam' ? (
                  <div className="booth-duo-view solo">
                    <div className="booth-feed-panel">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                          filter: selectedColorFilter.filter,
                          transition: 'filter 0.3s ease',
                        }}
                      />
                      <div className="feed-city-badge pink">
                        <span className="dot"></span> {nickname} (You)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      targetUploadCutRef.current = null;
                      fileInputRef.current?.click();
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#131418',
                      cursor: 'pointer',
                      padding: '24px',
                      textAlign: 'center',
                      border: '2px dashed rgba(255, 123, 163, 0.4)',
                      borderRadius: '10px',
                    }}
                  >
                    <span style={{ fontSize: '44px', marginBottom: '12px' }}>📁</span>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        marginBottom: '6px',
                      }}
                    >
                      Photo Upload Mode
                    </span>
                    <span
                      style={{
                        fontSize: '12.5px',
                        color: 'rgba(255, 255, 255, 0.65)',
                        maxWidth: '320px',
                        lineHeight: 1.5,
                      }}
                    >
                      Click here to upload photos from your device, or drag and drop any picture directly onto the cut frames below.
                    </span>
                    <button
                      className="btn btn-primary"
                      style={{
                        marginTop: '16px',
                        padding: '6px 16px',
                        fontSize: '12px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedMode('webcam');
                        setCameraError(null);
                      }}
                    >
                      📷 Switch to Live Camera
                    </button>
                  </div>
                )}

                {/* 3..2..1 High-Impact Radial Countdown HUD */}
                {countdown !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0, 0, 0, 0.42)',
                      backdropFilter: 'blur(3px)',
                      zIndex: 20,
                      pointerEvents: 'none',
                      animation: 'gl-rise 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        border: '4px solid rgba(255, 77, 128, 0.4)',
                        borderTopColor: '#FF4D80',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow:
                          '0 0 35px rgba(255, 77, 128, 0.65), inset 0 0 20px rgba(255, 77, 128, 0.35)',
                        animation: 'spin 1.2s linear infinite',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '68px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          color: '#FFFFFF',
                          textShadow:
                            '0 0 24px rgba(255, 77, 128, 0.95), 0 4px 12px rgba(0,0,0,0.6)',
                        }}
                      >
                        {countdown}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '6px 18px',
                        borderRadius: '999px',
                        background: 'rgba(14, 16, 22, 0.88)',
                        border: '1.5px solid rgba(255, 77, 128, 0.5)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.6px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                      }}
                    >
                      {singleRetakeCutIdx !== null
                        ? `RETAKING CUT 0${singleRetakeCutIdx + 1} OF 04 📸`
                        : `CUT 0${currentShotIdx + 1} OF 04 · POSE READY! ✨`}
                    </div>
                  </div>
                )}

                {/* Shutter Freeze-Snap Polaroid Feedback */}
                {freezeFrame && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 22,
                      pointerEvents: 'none',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={freezeFrame}
                      alt="Freeze Frame"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: `${selectedColorFilter.filter} brightness(1.12) contrast(1.06)`,
                        animation: 'flash-snap 0.38s ease-out forwards',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: '#FF4D80',
                        color: '#FFFFFF',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 900,
                        boxShadow: '0 4px 12px rgba(255, 77, 128, 0.5)',
                        letterSpacing: '0.8px',
                      }}
                    >
                      SNAP! 📸
                    </div>
                  </div>
                )}

                {/* Studio Camera Flashbulb Effect */}
                {flashing && flashEnabled && (
                  <div className="camera-flash-overlay" aria-hidden="true" />
                )}
                {flashing && flashEnabled && <div className="booth-camera-flash" />}

                {/* AR Filter Overlays */}
                {selectedArFilter.id === 'sparkles' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      fontSize: '32px',
                      zIndex: 6,
                    }}
                  >
                    <span style={{ animation: 'gl-tw 1.5s infinite' }}>✨</span>
                    <span style={{ animation: 'gl-tw 2s infinite' }}>🌟</span>
                    <span style={{ animation: 'gl-tw 1.8s infinite' }}>✨</span>
                  </div>
                )}
                {selectedArFilter.id === 'hearts' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      fontSize: '28px',
                      zIndex: 6,
                    }}
                  >
                    <span style={{ animation: 'gl-pulse 1.6s infinite' }}>
                      💖
                    </span>
                    <span style={{ animation: 'gl-pulse 2.2s infinite' }}>
                      💕
                    </span>
                    <span style={{ animation: 'gl-pulse 1.9s infinite' }}>
                      💗
                    </span>
                  </div>
                )}
                {selectedArFilter.id === 'cat' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '16px 40px',
                      fontSize: '28px',
                      zIndex: 6,
                    }}
                  >
                    <span>🐱</span>
                    <span>🐾</span>
                  </div>
                )}
                {selectedArFilter.id === 'halo' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      display: 'flex',
                      justifyContent: 'space-around',
                      padding: '10px',
                      fontSize: '28px',
                      zIndex: 6,
                    }}
                  >
                    <span>😇</span>
                    <span>😇</span>
                  </div>
                )}
              </div>

              {/* Shutter Button & AR Filter Bar */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    AR FX:
                  </span>
                  {AR_FILTERS.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedArFilter(f);
                        void activityRuntime.sendEvent('photo_filter', {
                          filter: f.id,
                        });
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border:
                          selectedArFilter.id === f.id
                            ? '1.5px solid var(--pink)'
                            : '1px solid var(--line)',
                        background:
                          selectedArFilter.id === f.id
                            ? 'var(--pink-tint)'
                            : 'var(--paper)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {f.emoji} {f.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isShooting && (
                    <button
                      className="btn btn-ghost"
                      onClick={cancelCaptureSequence}
                      style={{ padding: '12px 18px', fontSize: '14px', color: '#FF4D6A' }}
                    >
                      Cancel ⏹️
                    </button>
                  )}
                  {shootMode === 'manual' ? (
                    <button
                      className="btn btn-grad"
                      onClick={() => triggerSingleCutRetake(currentShotIdx)}
                      disabled={isShooting}
                      style={{ padding: '12px 26px', fontSize: '15px' }}
                    >
                      {isShooting
                        ? `Snapping Cut 0${currentShotIdx + 1} 📸...`
                        : `Snap Cut 0${currentShotIdx + 1} of 04 📸 (${timerDuration}s)`}
                    </button>
                  ) : (
                    <button
                      className="btn btn-grad"
                      onClick={startCaptureSequence}
                      disabled={isShooting}
                      style={{ padding: '12px 26px', fontSize: '15px' }}
                    >
                      {isShooting
                        ? `Taking Cut 0${currentShotIdx + 1}/04 📸...`
                        : `Take 4-Cut Photos 📸 (${timerDuration}s)`}
                    </button>
                  )}
                </div>
              </div>

              {/* Live Thumbnail Strip Progress */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-soft)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Live Capture Shots ({capturedShots.length} / 4):
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    Tip: Use ◀ / ▶ to reorder · ↷ to rotate · ⇄ to flip
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  {capturedShots.map((shot, i) => (
                    <div
                      key={i}
                      onDragOver={(e) => handleDragOverCut(i, e)}
                      onDragLeave={handleDragLeaveCut}
                      onDrop={(e) => handleDropOnCut(i, e)}
                      onClick={() => {
                        if (shootMode === 'manual' && !isShooting) {
                          setCurrentShotIdx(i);
                        }
                      }}
                      style={{
                        aspectRatio: '4/3',
                        background: '#17181C',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: shootMode === 'manual' ? 'pointer' : 'default',
                        border:
                          dragOverCutIdx === i
                            ? '2px dashed var(--pink)'
                            : currentShotIdx === i && (isShooting || shootMode === 'manual')
                              ? '2px solid var(--pink)'
                              : '1px solid var(--line)',
                        boxShadow:
                          dragOverCutIdx === i
                            ? '0 0 14px rgba(255, 123, 163, 0.5)'
                            : currentShotIdx === i && shootMode === 'manual'
                              ? '0 0 10px rgba(255, 123, 163, 0.4)'
                              : 'none',
                        transition: 'border 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <img
                        src={shot}
                        alt={`Shot ${i + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: `${selectedColorFilter.filter} brightness(${brightness}%) contrast(${contrast}%)`,
                          transform: `rotate(${cutTransforms[i]?.rotation || 0}deg) ${cutTransforms[i]?.flipX ? 'scaleX(-1)' : ''}`,
                          opacity: dragOverCutIdx === i ? 0.4 : 1,
                        }}
                      />
                      {dragOverCutIdx === i && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 123, 163, 0.25)',
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 800,
                            pointerEvents: 'none',
                            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                          }}
                        >
                          Drop Image 📥
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: '4px',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: '#fff',
                          background: currentShotIdx === i && shootMode === 'manual' ? 'var(--pink)' : 'rgba(0,0,0,0.65)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        0{i + 1}
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '3px',
                          display: 'flex',
                          gap: '2px',
                          zIndex: 5,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {i > 0 && (
                          <button
                            onClick={() => moveCut(i, i - 1)}
                            disabled={isShooting}
                            title="Move cut left"
                            style={{
                              background: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#fff',
                              fontSize: '8.5px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          >
                            ◀
                          </button>
                        )}
                        {i < 3 && (
                          <button
                            onClick={() => moveCut(i, i + 1)}
                            disabled={isShooting}
                            title="Move cut right"
                            style={{
                              background: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#fff',
                              fontSize: '8.5px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          >
                            ▶
                          </button>
                        )}
                        <button
                          onClick={() => rotateCut(i)}
                          disabled={isShooting}
                          title="Rotate 90° clockwise"
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          ↷
                        </button>
                        <button
                          onClick={() => flipCut(i)}
                          disabled={isShooting}
                          title="Flip horizontally"
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          ⇄
                        </button>
                        <button
                          onClick={() => triggerSingleCutRetake(i)}
                          disabled={isShooting}
                          title={`Retake cut 0${i + 1}`}
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => {
                            targetUploadCutRef.current = i;
                            fileInputRef.current?.click();
                          }}
                          disabled={isShooting}
                          title={`Upload image for cut 0${i + 1} (or drag & drop)`}
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          📁
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Photostrip Output */}
            <div className="strip-preview-holder">
              <div
                className="real-strip"
                style={{
                  background: customFrameColor || selectedStyle.bg,
                  color: selectedStyle.color,
                  borderColor: selectedStyle.border,
                }}
              >
                <div className="real-strip-brand">DEARLY US · 인생네컷</div>

                <div className="real-strip-frames" style={{ position: 'relative' }}>
                  {filmGrain && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'radial-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.12))',
                        mixBlendMode: 'overlay',
                        zIndex: 5,
                      }}
                    />
                  )}
                  {capturedShots.map((shot, idx) => (
                    <div
                      key={idx}
                      className="real-strip-cell"
                      onDragOver={(e) => handleDragOverCut(idx, e)}
                      onDragLeave={handleDragLeaveCut}
                      onDrop={(e) => handleDropOnCut(idx, e)}
                      style={{
                        position: 'relative',
                        outline:
                          dragOverCutIdx === idx
                            ? '2px dashed var(--pink)'
                            : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      <img
                        src={shot}
                        alt={`Cut ${idx + 1}`}
                        style={{
                          filter: `${selectedColorFilter.filter} brightness(${brightness}%) contrast(${contrast}%)`,
                          transform: `rotate(${cutTransforms[idx]?.rotation || 0}deg) ${cutTransforms[idx]?.flipX ? 'scaleX(-1)' : ''}`,
                          opacity: dragOverCutIdx === idx ? 0.5 : 1,
                        }}
                      />
                      {dragOverCutIdx === idx && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 123, 163, 0.3)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            pointerEvents: 'none',
                            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                          }}
                        >
                          Drop on Cut 0{idx + 1} 📥
                        </div>
                      )}
                      <span className="frame-tag">0{idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Placed Stickers on Strip */}
                {placedStickers.map((stk) => (
                  <div
                    key={stk.id}
                    style={{
                      position: 'absolute',
                      left: `${stk.x}%`,
                      top: `${stk.y}%`,
                      transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale}) ${stk.flipX ? 'scaleX(-1)' : ''}`,
                      pointerEvents: 'none',
                      zIndex: 25,
                      userSelect: 'none',
                    }}
                  >
                    {stk.isHangul ? (
                      <span
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid var(--pink)',
                          color: '#FF4D80',
                          padding: '3px 8px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {stk.content}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '20px',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                          display: 'inline-block',
                        }}
                      >
                        {stk.content}
                      </span>
                    )}
                  </div>
                ))}

                {/* Doodle paths preview with smooth bezier curves */}
                {doodlePaths.length > 0 && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 28,
                    }}
                  >
                    {doodlePaths.map((path, pIdx) => {
                      if (path.points.length < 2) return null;
                      const d = pointsToBezierPath(path.points);
                      return (
                        <path
                          key={pIdx}
                          d={d}
                          fill="none"
                          stroke={path.color}
                          strokeWidth="0.8"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter: `drop-shadow(0 0 3px ${path.color}) drop-shadow(0 0 6px ${path.color})`,
                          }}
                        />
                      );
                    })}
                  </svg>
                )}

                <div className="real-strip-footer">
                  <input
                    type="text"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    className="real-strip-name"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setCoupleName(
                        generateCupidotCaption(nickname, partnerName),
                      );
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--pink)',
                      fontWeight: 800,
                      marginTop: '4px',
                    }}
                    title="Click for Cupidot AI Keepsake Caption"
                  >
                    ✨ Cupidot AI Caption
                  </button>
                  <div className="real-strip-serial">
                    DEARLY US · <b>{roomCode}</b>
                  </div>
                </div>
              </div>

              {/* Strip Next Scene CTAs */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '250px',
                }}
              >
                <button
                  className="btn btn-grad"
                  onClick={() => setScene('EDIT')}
                  style={{ justifyContent: 'center' }}
                >
                  Next: Edit &amp; Color Filters ▷
                </button>
                <button
                  className="btn btn-primary"
                  onClick={downloadHighResStrip}
                  style={{ justifyContent: 'center' }}
                >
                  Download Photo Strip 💾
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 4: EDIT & COLOR FILTER (Review Shots, Swap Partners, Color Filters)
            ========================================================================= */}
        {(scene === 'EDIT' || scene === 'FILTER') && (
          <div className="booth-showcase-grid">
            <div className="booth-box">
              <span className="eyebrow">
                Step 4 &amp; 5 · Review &amp; Color Grading
              </span>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: '8px 0 16px',
                }}
              >
                Choose your photo color grade
              </h2>

              {/* Color Filter presets */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                  marginBottom: '24px',
                }}
              >
                {COLOR_FILTERS.map((cf) => (
                  <div
                    key={cf.id}
                    onClick={() => {
                      setSelectedColorFilter(cf);
                      void activityRuntime.sendEvent('photo_filter', {
                        filter: cf.id,
                      });
                    }}
                    style={{
                      border:
                        selectedColorFilter.id === cf.id
                          ? '2px solid var(--pink)'
                          : '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      background: 'var(--paper)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '4/3',
                        overflow: 'hidden',
                        borderRadius: '4px',
                        marginBottom: '6px',
                      }}
                    >
                      <img
                        src="/photos/frame1.webp"
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: cf.filter,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>
                      {cf.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reorder & Orient Cuts */}
              <div style={{ marginBottom: '22px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Reorder &amp; Adjust Cuts:
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    ◀ / ▶ reorder · ↷ rotate · ⇄ flip
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                  }}
                >
                  {capturedShots.map((shot, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#17181C',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        aspectRatio: '4/3',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <img
                        src={shot}
                        alt={`Cut ${i + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: `${selectedColorFilter.filter} brightness(${brightness}%) contrast(${contrast}%)`,
                          transform: `rotate(${cutTransforms[i]?.rotation || 0}deg) ${cutTransforms[i]?.flipX ? 'scaleX(-1)' : ''}`,
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: '4px',
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(0,0,0,0.65)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        0{i + 1}
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          right: '3px',
                          display: 'flex',
                          gap: '2px',
                          zIndex: 5,
                        }}
                      >
                        {i > 0 && (
                          <button
                            onClick={() => moveCut(i, i - 1)}
                            title="Move cut left"
                            style={{
                              background: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#fff',
                              fontSize: '8.5px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          >
                            ◀
                          </button>
                        )}
                        {i < 3 && (
                          <button
                            onClick={() => moveCut(i, i + 1)}
                            title="Move cut right"
                            style={{
                              background: 'rgba(0, 0, 0, 0.75)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#fff',
                              fontSize: '8.5px',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                          >
                            ▶
                          </button>
                        )}
                        <button
                          onClick={() => rotateCut(i)}
                          title="Rotate 90° clockwise"
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          ↷
                        </button>
                        <button
                          onClick={() => flipCut(i)}
                          title="Flip horizontally"
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          ⇄
                        </button>
                        <button
                          onClick={() => {
                            targetUploadCutRef.current = i;
                            fileInputRef.current?.click();
                          }}
                          title={`Upload photo for cut 0${i + 1}`}
                          style={{
                            background: 'rgba(0, 0, 0, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontSize: '8.5px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          📁
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Fine-Tuning Controls */}
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Photo Fine-Tuning:
                  </span>
                  <button
                    onClick={() => {
                      sounds.playTick();
                      setBrightness(100);
                      setContrast(100);
                      setFilmGrain(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pink)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reset Adjustments
                  </button>
                </div>

                {/* Brightness Presets */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--ink-soft)',
                      minWidth: '70px',
                      fontWeight: 600,
                    }}
                  >
                    Brightness:
                  </span>
                  {[
                    { label: '-15%', val: 85 },
                    { label: '-10%', val: 90 },
                    { label: 'Normal', val: 100 },
                    { label: '+10%', val: 110 },
                    { label: '+15%', val: 115 },
                  ].map((b) => (
                    <button
                      key={b.val}
                      onClick={() => {
                        sounds.playTick();
                        setBrightness(b.val);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border:
                          brightness === b.val
                            ? '1.5px solid var(--pink)'
                            : '1px solid var(--line)',
                        background:
                          brightness === b.val
                            ? 'var(--pink-tint)'
                            : 'var(--bg)',
                        color:
                          brightness === b.val
                            ? 'var(--pink)'
                            : 'var(--ink-soft)',
                        cursor: 'pointer',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {/* Contrast Presets */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--ink-soft)',
                      minWidth: '70px',
                      fontWeight: 600,
                    }}
                  >
                    Contrast:
                  </span>
                  {[
                    { label: '-15%', val: 85 },
                    { label: '-10%', val: 90 },
                    { label: 'Normal', val: 100 },
                    { label: '+10%', val: 110 },
                    { label: '+15%', val: 115 },
                  ].map((c) => (
                    <button
                      key={c.val}
                      onClick={() => {
                        sounds.playTick();
                        setContrast(c.val);
                      }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border:
                          contrast === c.val
                            ? '1.5px solid var(--pink)'
                            : '1px solid var(--line)',
                        background:
                          contrast === c.val
                            ? 'var(--pink-tint)'
                            : 'var(--bg)',
                        color:
                          contrast === c.val
                            ? 'var(--pink)'
                            : 'var(--ink-soft)',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Film Grain Texture Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>
                      🎞️ Vintage Film Grain
                    </span>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        margin: '1px 0 0',
                      }}
                    >
                      Adds organic film camera analog grain texture
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setFilmGrain(!filmGrain);
                    }}
                    className={`btn ${filmGrain ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 10px', fontSize: '11.5px' }}
                  >
                    {filmGrain ? '✓ Grain On' : 'Grain Off'}
                  </button>
                </div>
              </div>

              {/* Frame Cardstock Color Palette */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Frame Cardstock Color:
                  </label>
                  {customFrameColor && (
                    <button
                      onClick={() => {
                        sounds.playTick();
                        setCustomFrameColor(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--pink)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Use Theme Default
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {[
                    { name: 'Classic White', hex: '#FFFFFF', border: '#E2E8F0' },
                    { name: 'Charcoal Dark', hex: '#18191E', border: '#333742' },
                    { name: 'Blush Pink', hex: '#FFE4E8', border: '#FECDD3' },
                    { name: 'Buttercream', hex: '#FFFBEB', border: '#FEF3C7' },
                    { name: 'Sky Blue', hex: '#E0F2FE', border: '#BAE6FD' },
                    { name: 'Lavender Lilac', hex: '#F3E8FF', border: '#E9D5FF' },
                    { name: 'Misty Sage', hex: '#E2ECE9', border: '#CBD5E1' },
                    { name: 'Matcha Green', hex: '#DCFCE7', border: '#BBF7D0' },
                  ].map((fc) => {
                    const isSelected = customFrameColor === fc.hex;
                    return (
                      <button
                        key={fc.hex}
                        onClick={() => {
                          sounds.playPop();
                          setCustomFrameColor(fc.hex);
                        }}
                        title={fc.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: fc.hex,
                          border: isSelected
                            ? '2.5px solid var(--pink)'
                            : `1.5px solid ${fc.border}`,
                          boxShadow: isSelected
                            ? '0 0 10px rgba(255, 77, 128, 0.45)'
                            : '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease, border 0.15s ease',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Layout Switcher */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Strip Format:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border:
                          selectedLayout.id === layout.id
                            ? '1.5px solid var(--pink)'
                            : '1px solid var(--line)',
                        background:
                          selectedLayout.id === layout.id
                            ? 'var(--pink-tint)'
                            : 'var(--paper)',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {layout.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setScene('BOOTH')}
                >
                  ← Retake Photos
                </button>
                <button
                  className="btn btn-grad"
                  onClick={() => setScene('DECORATE')}
                >
                  Next: Add Stickers ▷
                </button>
              </div>
            </div>

            {/* Right Strip */}
            <div className="strip-preview-holder">
              <div
                className="real-strip"
                style={{
                  background: customFrameColor || selectedStyle.bg,
                  color: selectedStyle.color,
                  borderColor: selectedStyle.border,
                }}
              >
                <div className="real-strip-brand">DEARLY US · 인생네컷</div>
                <div className="real-strip-frames" style={{ position: 'relative' }}>
                  {filmGrain && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'radial-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.12))',
                        mixBlendMode: 'overlay',
                        zIndex: 5,
                      }}
                    />
                  )}
                  {capturedShots.map((shot, idx) => (
                    <div key={idx} className="real-strip-cell">
                      <img
                        src={shot}
                        alt=""
                        style={{
                          filter: `${selectedColorFilter.filter} brightness(${brightness}%) contrast(${contrast}%)`,
                          transform: `rotate(${cutTransforms[idx]?.rotation || 0}deg) ${cutTransforms[idx]?.flipX ? 'scaleX(-1)' : ''}`,
                        }}
                      />
                      <span className="frame-tag">0{idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Placed Stickers Preview */}
                {placedStickers.map((stk) => (
                  <div
                    key={stk.id}
                    style={{
                      position: 'absolute',
                      left: `${stk.x}%`,
                      top: `${stk.y}%`,
                      transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
                      pointerEvents: 'none',
                      zIndex: 25,
                      userSelect: 'none',
                    }}
                  >
                    {stk.isHangul ? (
                      <span
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid var(--pink)',
                          color: '#FF4D80',
                          padding: '3px 8px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {stk.content}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '20px',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                          display: 'inline-block',
                        }}
                      >
                        {stk.content}
                      </span>
                    )}
                  </div>
                ))}

                {/* Doodle paths preview */}
                {doodlePaths.length > 0 && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 28,
                    }}
                  >
                    {doodlePaths.map((path, pIdx) => {
                      if (path.points.length < 2) return null;
                      const d = path.points.reduce(
                        (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                        '',
                      );
                      return (
                        <path
                          key={pIdx}
                          d={d}
                          fill="none"
                          stroke={path.color}
                          strokeWidth="0.8"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter: `drop-shadow(0 0 3px ${path.color}) drop-shadow(0 0 6px ${path.color})`,
                          }}
                        />
                      );
                    })}
                  </svg>
                )}

                <div className="real-strip-footer">
                  <div className="real-strip-name">{coupleName}</div>
                  <div className="real-strip-serial">
                    DEARLY US · <b>{roomCode}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCENE 5: DECORATE & DOWNLOAD (Stickers, Couple Signatures, Canvas Download)
            ========================================================================= */}
        {(scene === 'DECORATE' || scene === 'DOWNLOAD') && (
          <div className="booth-showcase-grid">
            <div className="booth-box">
              <span className="eyebrow">
                Step 6 &amp; 7 · Decorate &amp; Download
              </span>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: '8px 0 16px',
                }}
              >
                Customize your keepsake
              </h2>

              {/* Couple Name */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  Couple Names on Strip:
                </label>
                <input
                  type="text"
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '16px',
                    fontWeight: 700,
                  }}
                />
              </div>

              {/* Categorized Korean Sticker Studio */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Sticker Studio &amp; Korean Badges:
                  </label>
                  {placedStickers.length > 0 && (
                    <button
                      onClick={() => {
                        sounds.playTick();
                        setPlacedStickers([]);
                        setSelectedStickerId(null);
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'none',
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear All ({placedStickers.length})
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div
                  style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}
                >
                  {STICKER_CATEGORIES.map((cat) => {
                    const isActive = activeStickerTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          sounds.playPop();
                          setActiveStickerTab(cat.id as any);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: isActive
                            ? '1.5px solid var(--pink)'
                            : '1px solid var(--line)',
                          background: isActive
                            ? 'var(--pink-tint)'
                            : 'var(--paper)',
                          color: isActive ? 'var(--pink)' : 'var(--ink-soft)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Active Category Sticker Grid */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    background: 'var(--paper)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    minHeight: '60px',
                  }}
                >
                  {STICKER_CATEGORIES.find(
                    (c) => c.id === activeStickerTab,
                  )?.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        addSticker(item.text, (item as any).isHangul)
                      }
                      title={item.label}
                      style={{
                        padding: (item as any).isHangul
                          ? '6px 14px'
                          : '6px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        background: '#FFFFFF',
                        fontSize: (item as any).isHangul ? '13px' : '20px',
                        fontWeight: (item as any).isHangul ? 800 : 400,
                        color: (item as any).isHangul
                          ? 'var(--pink)'
                          : 'inherit',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--ink-soft)',
                    marginTop: '6px',
                    marginInline: '2px',
                  }}
                >
                  💡 <b>Tip:</b> Tap stickers to drop onto your strip · Drag to
                  reposition · Tap on a sticker to rotate, resize, or remove.
                </p>
              </div>

              {/* Motion Strip Mode & Neon Doodling Controls */}
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>
                    🎞️ Korean Photogray Motion Mode
                  </span>
                  <button
                    onClick={() => setIsMotionMode(!isMotionMode)}
                    className={`btn ${isMotionMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    {isMotionMode ? '✓ Motion Active' : 'Enable Motion'}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-soft)',
                    margin: 0,
                  }}
                >
                  Loops all 4 cuts in an animated motion sequence mimicking
                  Korean live photostrips.
                </p>

                {/* Neon Pen Selector & Drawing Controls */}
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      🎨 Neon Glow Pen:
                    </span>
                    <button
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                      className={`btn ${isDrawingMode ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                    >
                      {isDrawingMode ? '✏️ Drawing Active' : '✏️ Draw on Strip'}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {/* Neon Color Palette */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[
                        '#FF7BA3',
                        '#5FA0FF',
                        '#FFD68A',
                        '#4ECCA3',
                        '#FFFFFF',
                      ].map((col) => (
                        <button
                          key={col}
                          onClick={() => {
                            setNeonPenColor(col);
                            setIsDrawingMode(true);
                          }}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: col,
                            border:
                              neonPenColor === col
                                ? '2px solid #17181C'
                                : '1px solid rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            boxShadow:
                              neonPenColor === col ? `0 0 8px ${col}` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    {/* Brush Size Selector */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                        Size:
                      </span>
                      {[
                        { label: 'Fine', w: 2 },
                        { label: 'Marker', w: 5 },
                        { label: 'Bold', w: 9 },
                      ].map((b) => (
                        <button
                          key={b.w}
                          onClick={() => {
                            setDoodleBrushWidth(b.w);
                            setIsDrawingMode(true);
                          }}
                          className={`btn ${doodleBrushWidth === b.w ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            height: '24px',
                            lineHeight: '1',
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>

                    {/* Undo / Redo / Clear */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (doodlePaths.length === 0) return;
                          sounds.playTick();
                          const last = doodlePaths[doodlePaths.length - 1];
                          setDoodleRedoStack((prev) => [...prev, last]);
                          setDoodlePaths((prev) => prev.slice(0, -1));
                        }}
                        disabled={doodlePaths.length === 0}
                        style={{
                          background: 'none',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          cursor: doodlePaths.length > 0 ? 'pointer' : 'default',
                          opacity: doodlePaths.length > 0 ? 1 : 0.5,
                        }}
                      >
                        ↩ Undo
                      </button>
                      <button
                        onClick={() => {
                          if (doodleRedoStack.length === 0) return;
                          sounds.playTick();
                          const next = doodleRedoStack[doodleRedoStack.length - 1];
                          setDoodleRedoStack((prev) => prev.slice(0, -1));
                          setDoodlePaths((prev) => [...prev, next]);
                        }}
                        disabled={doodleRedoStack.length === 0}
                        style={{
                          background: 'none',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          cursor: doodleRedoStack.length > 0 ? 'pointer' : 'default',
                          opacity: doodleRedoStack.length > 0 ? 1 : 0.5,
                        }}
                      >
                        Redo ↪
                      </button>
                      <button
                        onClick={() => {
                          sounds.playTick();
                          setDoodlePaths([]);
                          setDoodleRedoStack([]);
                        }}
                        disabled={doodlePaths.length === 0}
                        style={{
                          background: 'none',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          cursor: doodlePaths.length > 0 ? 'pointer' : 'default',
                          opacity: doodlePaths.length > 0 ? 1 : 0.5,
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {isDrawingMode && (
                    <p style={{ fontSize: '11px', color: 'var(--pink)', margin: 0 }}>
                      ✏️ Click &amp; drag directly on the photostrip preview to doodle with glowing neon ink!
                    </p>
                  )}
                </div>

                {/* 90s Vintage Cam Date Stamp & Light Leak Toggle */}
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>
                      🎞️ 90s Film Cam Mode
                    </span>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--ink-soft)',
                        margin: '2px 0 0',
                      }}
                    >
                      LED date stamp (&apos;26 9 3) &amp; warm nostalgic light
                      leaks.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setIsVintageCamMode(!isVintageCamMode);
                    }}
                    className={`btn ${isVintageCamMode ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isVintageCamMode ? '✓ Vintage Active' : 'Enable Vintage'}
                  </button>
                </div>
              </div>

              {/* Classic Korean Twin-Strip Duo Toggle */}
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: '13px' }}>
                    ✂️ Classic Korean Twin-Strip (2-in-1 Duo)
                  </span>
                  <p
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--ink-soft)',
                      margin: '2px 0 0',
                    }}
                  >
                    Side-by-side duo print with center scissor cut-line for both of you.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsTwinStrip(!isTwinStrip);
                  }}
                  className={`btn ${isTwinStrip ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isTwinStrip ? '✓ Twin Strip (1200w)' : 'Single Strip (600w)'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={downloadHighResStrip}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '15px',
                  }}
                >
                  Download High-Res {isTwinStrip ? 'Twin-Strip (1200×1600)' : 'Strip (600×1600)'} PNG 💾
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-ghost"
                    onClick={copyStripToClipboard}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '13px',
                      color: clipboardCopied ? 'var(--pink)' : undefined,
                    }}
                  >
                    {clipboardCopied ? '✓ Copied to Clipboard!' : 'Copy to Clipboard 📋'}
                  </button>
                  <button
                    className="btn btn-grad"
                    onClick={async () => {
                      sounds.playCelebration();
                      setConfettiActive(true);
                      setTimeout(() => setConfettiActive(false), 3000);
                      try {
                        await downloadAnimatedStripVideo(
                          capturedShots,
                          `dearly-us-live-strip-${roomCode}.webm`,
                          {
                            includeFlash: true,
                            fps: 2,
                            frameBorderColor: selectedStyle.bg,
                          },
                        );
                      } catch {}
                    }}
                    style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                  >
                    Export Video 🎞️
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={copyRoomLink}
                    style={{ padding: '10px 14px', fontSize: '13px' }}
                  >
                    {copied ? '✓ Link' : 'Share 🔗'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Finished Strip */}
            <div className="strip-preview-holder">
              <TiltedCard maxAngle={8} scale={1.02}>
                <div
                  className="real-strip"
                  style={{
                    background: customFrameColor || selectedStyle.bg,
                    color: selectedStyle.color,
                    borderColor:
                      selectedStyle.foilEffect === 'matte-foil'
                        ? '#E2E8F0'
                        : selectedStyle.border,
                    boxShadow:
                      selectedStyle.foilEffect === 'holographic'
                        ? '0 20px 50px rgba(192, 132, 252, 0.3), 0 0 30px rgba(255, 209, 220, 0.4)'
                        : selectedStyle.foilEffect === 'chrome'
                          ? '0 20px 50px rgba(148, 163, 184, 0.4), inset 0 0 0 1px rgba(255,255,255,0.8)'
                          : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Holographic / Chrome Specular Overlay */}
                  {selectedStyle.foilEffect === 'holographic' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(125deg, transparent 20%, rgba(255, 255, 255, 0.45) 35%, transparent 50%, rgba(255, 255, 255, 0.35) 65%, transparent 80%)',
                        backgroundSize: '250% 250%',
                        mixBlendMode: 'overlay',
                        pointerEvents: 'none',
                        zIndex: 4,
                      }}
                    />
                  )}
                  {selectedStyle.foilEffect === 'chrome' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 35%, rgba(255, 255, 255, 0.3) 65%, transparent 100%)',
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                        zIndex: 4,
                      }}
                    />
                  )}

                  <div className="real-strip-brand">DEARLY US · 인생네컷</div>
                  <div className="real-strip-frames" style={{ position: 'relative' }}>
                    {filmGrain && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          background: 'radial-gradient(rgba(255,255,255,0.06), rgba(0,0,0,0.12))',
                          mixBlendMode: 'overlay',
                          zIndex: 5,
                        }}
                      />
                    )}
                    {capturedShots.map((shot, idx) => (
                      <div
                        key={idx}
                        className="real-strip-cell"
                        onDragOver={(e) => handleDragOverCut(idx, e)}
                        onDragLeave={handleDragLeaveCut}
                        onDrop={(e) => handleDropOnCut(idx, e)}
                        style={{
                          transform:
                            isMotionMode && motionFrameIdx === idx
                              ? 'scale(1.03)'
                              : 'scale(1)',
                          transition: 'transform 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          outline:
                            dragOverCutIdx === idx
                              ? '2px dashed var(--pink)'
                              : 'none',
                          outlineOffset: '-2px',
                        }}
                      >
                        <img
                          src={shot}
                          alt=""
                          style={{
                            filter: `${selectedColorFilter.filter} brightness(${brightness}%) contrast(${contrast}%)`,
                            transform: `rotate(${cutTransforms[idx]?.rotation || 0}deg) ${cutTransforms[idx]?.flipX ? 'scaleX(-1)' : ''}`,
                            opacity: dragOverCutIdx === idx ? 0.5 : 1,
                          }}
                        />
                        {dragOverCutIdx === idx && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255, 123, 163, 0.3)',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 800,
                              pointerEvents: 'none',
                              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            Drop on Cut 0{idx + 1} 📥
                          </div>
                        )}
                        <span className="frame-tag">0{idx + 1}</span>

                        {/* Optional 90s Film Cam Overlays */}
                        {isVintageCamMode && (
                          <>
                            {/* Warm Light Leak */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                  'radial-gradient(ellipse at 85% 15%, rgba(255, 120, 50, 0.42) 0%, rgba(255, 40, 100, 0.22) 40%, transparent 75%)',
                                mixBlendMode: 'screen',
                                pointerEvents: 'none',
                                zIndex: 6,
                              }}
                            />
                            {/* LED Date Stamp */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '8px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '10.5px',
                                fontWeight: 900,
                                color: '#FF6A00',
                                textShadow:
                                  '0 0 4px #FF4500, 0 0 8px rgba(255, 69, 0, 0.6)',
                                letterSpacing: '1px',
                                pointerEvents: 'none',
                                zIndex: 8,
                              }}
                            >
                              &apos;26 &nbsp;9 &nbsp;3
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Interactive Neon Pen SVG Layer */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: isDrawingMode ? 'auto' : 'none',
                      zIndex: isDrawingMode ? 38 : 28,
                      touchAction: 'none',
                      cursor: isDrawingMode ? 'crosshair' : 'default',
                    }}
                    onPointerDown={(e) => {
                      if (!isDrawingMode) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setIsDrawing(true);
                      setDoodleRedoStack([]);
                      setDoodlePaths((prev) => [
                        ...prev,
                        { color: neonPenColor, width: doodleBrushWidth, points: [{ x, y }] },
                      ]);
                    }}
                    onPointerMove={(e) => {
                      if (!isDrawing || !isDrawingMode) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setDoodlePaths((prev) => {
                        if (prev.length === 0) return prev;
                        const last = prev[prev.length - 1];
                        const updatedLast = {
                          ...last,
                          points: [...last.points, { x, y }],
                        };
                        return [...prev.slice(0, -1), updatedLast];
                      });
                    }}
                    onPointerUp={() => setIsDrawing(false)}
                    onPointerLeave={() => setIsDrawing(false)}
                  >
                    {doodlePaths.map((path, pIdx) => {
                      if (path.points.length < 2) return null;
                      const d = pointsToBezierPath(path.points);
                      const strokeW = (path.width || 5) * 0.16;
                      return (
                        <path
                          key={pIdx}
                          d={d}
                          fill="none"
                          stroke={path.color}
                          strokeWidth={strokeW}
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter: `drop-shadow(0 0 3px ${path.color}) drop-shadow(0 0 6px ${path.color})`,
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Interactive Draggable Placed Stickers Layer */}
                  {placedStickers.map((stk) => {
                    const isSelected = selectedStickerId === stk.id;
                    return (
                      <div
                        key={stk.id}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedStickerId(stk.id);
                          setIsDraggingSticker(true);
                          try {
                            e.currentTarget.setPointerCapture(e.pointerId);
                          } catch {}
                          const stripEl = e.currentTarget.parentElement;
                          if (!stripEl) return;
                          const rect = stripEl.getBoundingClientRect();

                          const onPointerMove = (moveEvt: PointerEvent) => {
                            const newX = Math.max(
                              5,
                              Math.min(
                                95,
                                ((moveEvt.clientX - rect.left) / rect.width) *
                                  100,
                              ),
                            );
                            const newY = Math.max(
                              4,
                              Math.min(
                                96,
                                ((moveEvt.clientY - rect.top) / rect.height) *
                                  100,
                              ),
                            );
                            updateSticker(stk.id, {
                              x: Math.round(newX),
                              y: Math.round(newY),
                            });
                          };

                          const onPointerUp = () => {
                            setIsDraggingSticker(false);
                            window.removeEventListener(
                              'pointermove',
                              onPointerMove,
                            );
                            window.removeEventListener(
                              'pointerup',
                              onPointerUp,
                            );
                          };

                          window.addEventListener('pointermove', onPointerMove);
                          window.addEventListener('pointerup', onPointerUp);
                        }}
                        style={{
                          position: 'absolute',
                          left: `${stk.x}%`,
                          top: `${stk.y}%`,
                          transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale}) ${stk.flipX ? 'scaleX(-1)' : ''}`,
                          cursor: isDraggingSticker && isSelected ? 'grabbing' : 'grab',
                          userSelect: 'none',
                          touchAction: 'none',
                          zIndex: isSelected ? 35 : 25,
                          transition: isDraggingSticker ? 'none' : 'transform 0.1s ease',
                        }}
                      >
                        {stk.isHangul ? (
                          <span
                            style={{
                              background: '#FFFFFF',
                              border: isSelected
                                ? '2px solid #FF4D80'
                                : '1.5px solid var(--pink)',
                              color: '#FF4D80',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-display)',
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(255,123,163,0.4), 0 6px 16px rgba(0,0,0,0.22)'
                                : '0 2px 8px rgba(0,0,0,0.12)',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {stk.content}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '24px',
                              filter: isSelected
                                ? 'drop-shadow(0 0 6px rgba(255,123,163,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))'
                                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                              display: 'inline-block',
                            }}
                          >
                            {stk.content}
                          </span>
                        )}

                        {/* Selected Sticker Floating Quick Controls */}
                        {isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '-32px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              display: 'flex',
                              gap: '3px',
                              background: 'rgba(14, 16, 22, 0.92)',
                              padding: '2px 4px',
                              borderRadius: '16px',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                              backdropFilter: 'blur(8px)',
                              zIndex: 45,
                            }}
                          >
                            <button
                              onClick={() =>
                                updateSticker(stk.id, {
                                  rotation: stk.rotation - 12,
                                })
                              }
                              title="Rotate Left"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ↺
                            </button>
                            <button
                              onClick={() =>
                                updateSticker(stk.id, {
                                  rotation: stk.rotation + 12,
                                })
                              }
                              title="Rotate Right"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ↻
                            </button>
                            <button
                              onClick={() =>
                                updateSticker(stk.id, {
                                  scale: Math.max(0.7, stk.scale - 0.15),
                                })
                              }
                              title="Smaller"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ➖
                            </button>
                            <button
                              onClick={() =>
                                updateSticker(stk.id, {
                                  scale: Math.min(1.6, stk.scale + 0.15),
                                })
                              }
                              title="Larger"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ➕
                            </button>
                            <button
                              onClick={() => flipStickerHorizontal(stk.id)}
                              title="Flip Horizontal (⇄)"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ⇄
                            </button>
                            <button
                              onClick={() => bringForward(stk.id)}
                              title="Bring Forward Layer (⬆️)"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ⬆️
                            </button>
                            <button
                              onClick={() => sendBackward(stk.id)}
                              title="Send Backward Layer (⬇️)"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={() => duplicateSticker(stk.id)}
                              title="Duplicate / Clone (+)"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                            >
                              📑
                            </button>
                            <button
                              onClick={() => removeSticker(stk.id)}
                              title="Delete Sticker"
                              style={{
                                background: 'rgba(255,77,106,0.3)',
                                border: 'none',
                                color: '#FF7BA3',
                                fontSize: '10px',
                                cursor: 'pointer',
                                padding: '2px 5px',
                                borderRadius: '8px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="real-strip-footer">
                    <div className="real-strip-name">{coupleName}</div>
                    <div className="real-strip-serial">
                      DEARLY US · <b>{roomCode}</b>
                    </div>
                  </div>
                </div>
              </TiltedCard>

              <button
                className="btn btn-grad"
                onClick={downloadHighResStrip}
                style={{ width: '250px', justifyContent: 'center' }}
              >
                Download PNG 💾
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 1-Tap Shareable Room Invite Modal */}
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomCode={roomCode}
        activityName="Korean Life4Cuts Photobooth"
        partnerAName={nickname}
        activitySlug="photobooth"
      />
    </div>
  );
}
