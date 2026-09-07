'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

import type { CupidotState } from '@/types/cupidot';

export type BotState =
  | 'idle'
  | 'happy'
  | 'love'
  | 'thinking'
  | 'talking'
  | 'sleeping'
  | 'celebration'
  | 'angry'
  | 'sassy'
  | 'shock'
  | 'pouty'
  | 'tweaking';

export function resolveVisualState(
  state: BotState | CupidotState = 'idle',
): BotState {
  switch (state) {
    case 'resting':
    case 'settling_for_night':
      return 'sleeping';
    case 'welcoming':
      return 'happy';
    case 'reunion':
    case 'anticipating_reveal':
    case 'curating_memory':
      return 'love';
    case 'celebrating':
      return 'celebration';
    case 'curious':
    case 'reconnecting':
      return 'thinking';
    case 'hosting':
      return 'talking';
    case 'focused':
    case 'waiting':
      return 'idle';
    default:
      return state as BotState;
  }
}

export interface CupidotBotProps {
  state?: BotState | CupidotState;
  scale?: number;
  position?: [number, number, number];
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onStateChange?: (state: BotState | CupidotState) => void;
  showGlow?: boolean;
  showParticles?: boolean;
}

// The original GLB stays in the repository as the editable source backup.
const MODEL_URL = '/models/cupidot/cupidot.optimized.glb';

function createHeartTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#ff4d80';
  context.beginPath();
  context.moveTo(32, 55);
  context.bezierCurveTo(16, 42, 5, 31, 5, 18);
  context.bezierCurveTo(5, 4, 23, 4, 32, 17);
  context.bezierCurveTo(41, 4, 59, 4, 59, 18);
  context.bezierCurveTo(59, 31, 48, 42, 32, 55);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Shared 3D presentation stage for the static Cupidot GLB. */
export function CupidotBot({
  state = 'idle',
  scale = 2,
  position = [0, 0, 0],
  interactive = true,
  className = '',
  style,
  onClick,
  onStateChange,
  showGlow = true,
  showParticles = true,
}: CupidotBotProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  stateRef.current = state;

  useEffect(() => onStateChange?.(state), [onStateChange, state]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let frame = 0;
    let disposed = false;
    let isVisible = true;
    let isDocumentVisible = !document.hidden;
    let renderer: THREE.WebGLRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let heartTexture: THREE.CanvasTexture | null = null;
    let modelAnchor: THREE.Group | null = null;
    let baseScale = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    const hearts = new THREE.Group();
    const basePosition = new THREE.Vector3(...position);
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const shouldRender = () => !disposed && isVisible && isDocumentVisible;

    const render = () => renderer?.render(scene, camera);
    const fitCamera = () => {
      if (!renderer || !modelAnchor) return;
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      const size = new THREE.Box3()
        .setFromObject(modelAnchor)
        .getSize(new THREE.Vector3());
      const vertical =
        size.y / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const horizontal =
        size.x /
        2 /
        (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      camera.position.set(
        0,
        0.03,
        Math.max(vertical, horizontal) * 1.42 + size.z * 0.55,
      );
      camera.lookAt(0, 0.02, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      render();
    };

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, reducedMotion ? 1 : 1.5),
      );
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xfff7fa, 0x57334a, 2.2));
      const key = new THREE.DirectionalLight(0xfff5ed, 3.2);
      key.position.set(2.5, 3, 3);
      scene.add(key);
      const pinkRim = new THREE.DirectionalLight(0xff78a7, 2.7);
      pinkRim.position.set(-3, 1, -2);
      scene.add(pinkRim);
      const goldRim = new THREE.DirectionalLight(0xffd584, 1.7);
      goldRim.position.set(1, -1, -2);
      scene.add(goldRim);
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(0.78, 48),
        new THREE.MeshBasicMaterial({
          color: 0xff77a5,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.5;
      scene.add(floor);

      if (showParticles && !reducedMotion) {
        heartTexture = createHeartTexture();
        for (let index = 0; index < 12; index += 1) {
          const heart = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: heartTexture,
              transparent: true,
              opacity: 0.68,
              depthWrite: false,
            }),
          );
          heart.position.set(
            (Math.random() - 0.5) * 1.15,
            -0.42 + Math.random() * 0.85,
            (Math.random() - 0.5) * 0.35,
          );
          const size = 0.07 + Math.random() * 0.055;
          heart.scale.set(size, size, 1);
          hearts.add(heart);
        }
        scene.add(hearts);
      }

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        MODEL_URL,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          const rawBox = new THREE.Box3().setFromObject(model);
          const center = rawBox.getCenter(new THREE.Vector3());
          const size = rawBox.getSize(new THREE.Vector3());
          baseScale =
            THREE.MathUtils.clamp(scale * 0.78, 1.25, 2.15) /
            Math.max(size.y, 0.01);
          model.scale.setScalar(baseScale);
          model.position.set(
            -center.x * baseScale,
            -center.y * baseScale,
            -center.z * baseScale,
          );
          model.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            (Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material]
            ).forEach((material) => {
              if ('roughness' in material)
                (material as THREE.MeshStandardMaterial).roughness = 0.52;
              if ('metalness' in material)
                (material as THREE.MeshStandardMaterial).metalness = 0.02;
              material.needsUpdate = true;
            });
          });
          modelAnchor = new THREE.Group();
          modelAnchor.add(model);
          scene.add(modelAnchor);
          setLoading(false);
          fitCamera();
        },
        undefined,
        () => {
          if (!disposed) {
            setLoadError(true);
            setLoading(false);
          }
        },
      );

      const onPointerMove = (event: PointerEvent) => {
        if (!interactive || reducedMotion) return;
        const bounds = container.getBoundingClientRect();
        targetPointer.set(
          THREE.MathUtils.clamp(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -1,
            1,
          ),
          THREE.MathUtils.clamp(
            -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
            -1,
            1,
          ),
        );
      };
      const onPointerLeave = () => targetPointer.set(0, 0);
      const onVisibilityChange = () => {
        isDocumentVisible = !document.hidden;
      };
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerleave', onPointerLeave);
      document.addEventListener('visibilitychange', onVisibilityChange);
      resizeObserver = new ResizeObserver(fitCamera);
      resizeObserver.observe(container);
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry?.isIntersecting ?? false;
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(container);

      const animate = () => {
        frame = requestAnimationFrame(animate);
        if (!shouldRender()) return;
        const time = clock.getElapsedTime();
        const mood = resolveVisualState(stateRef.current);
        const motion = reducedMotion ? 0 : 1;
        pointer.lerp(targetPointer, 0.065);
        if (modelAnchor) {
          modelAnchor.position
            .copy(basePosition)
            .add(new THREE.Vector3(0, Math.sin(time * 2) * 0.026 * motion, 0));
          modelAnchor.rotation.set(
            pointer.y * -0.11 * motion,
            pointer.x * 0.28 * motion,
            0,
          );
          modelAnchor.scale.setScalar(1);
          if (mood === 'happy' || mood === 'celebration') {
            modelAnchor.position.y +=
              Math.abs(Math.sin(time * 5.7)) * 0.09 * motion;
            modelAnchor.rotation.z = Math.sin(time * 4.2) * 0.08 * motion;
          } else if (mood === 'love') {
            modelAnchor.position.z += 0.08;
            modelAnchor.scale.setScalar(
              1 + Math.sin(time * 3.4) * 0.035 * motion,
            );
          } else if (mood === 'thinking') {
            modelAnchor.rotation.z = 0.15;
            modelAnchor.rotation.y = -0.18;
          } else if (mood === 'talking') {
            modelAnchor.position.y += Math.sin(time * 8.5) * 0.028 * motion;
            modelAnchor.rotation.x += Math.sin(time * 7) * 0.055 * motion;
          } else if (mood === 'sleeping') {
            modelAnchor.position.y += Math.sin(time) * 0.014 * motion;
            modelAnchor.rotation.z = -0.045;
          } else if (mood === 'sassy' || mood === 'pouty') {
            modelAnchor.rotation.z = mood === 'sassy' ? 0.18 : -0.1;
            modelAnchor.rotation.y += mood === 'sassy' ? -0.18 : 0.22;
          } else if (
            mood === 'shock' ||
            mood === 'angry' ||
            mood === 'tweaking'
          ) {
            modelAnchor.position.x +=
              Math.sin(time * (mood === 'angry' ? 28 : 18)) * 0.014 * motion;
            modelAnchor.rotation.z += Math.sin(time * 18) * 0.055 * motion;
          }
        }
        hearts.children.forEach((heart, index) => {
          const sprite = heart as THREE.Sprite;
          sprite.position.y +=
            (mood === 'love' || mood === 'celebration' ? 0.006 : 0.0022) *
            motion;
          sprite.position.x += Math.sin(time * 1.8 + index) * 0.0008 * motion;
          if (sprite.position.y > 0.55) sprite.position.y = -0.48;
        });
        hearts.visible = mood !== 'sleeping';
        render();
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerleave', onPointerLeave);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        heartTexture?.dispose();
        scene.traverse((object) => {
          if (!(object as THREE.Mesh).isMesh) return;
          const mesh = object as THREE.Mesh;
          mesh.geometry.dispose();
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((material) => material.dispose());
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch {
      setLoadError(true);
      setLoading(false);
    }
  }, [interactive, position, scale, showParticles]);

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      className={`cupidot-3d-stage ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '160px',
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
    >
      {showGlow && !loading && !loadError && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: '76%',
            height: '25%',
            left: '12%',
            bottom: '5%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(255,106,153,.35), rgba(255,190,145,.1) 55%, transparent 75%)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        />
      )}
      {loading && (
        <div className="cupidot-stage-status">Waking up Cupidot…</div>
      )}
      {loadError && (
        <div className="cupidot-stage-status" role="status">
          Cupidot needs a moment — try again soon.
        </div>
      )}
    </div>
  );
}
