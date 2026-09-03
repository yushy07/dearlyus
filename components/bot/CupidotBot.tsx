'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

export interface CupidotBotProps {
  state?: BotState;
  scale?: number;
  position?: [number, number, number];
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onStateChange?: (state: BotState) => void;
  showGlow?: boolean;
  showParticles?: boolean;
}

// Procedural 2D heart texture generator for particles
function createHeartTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#FF4D80';
  ctx.shadowColor = '#FFA8C5';
  ctx.shadowBlur = 8;

  // Draw smooth heart path
  ctx.beginPath();
  ctx.moveTo(32, 20);
  ctx.bezierCurveTo(32, 14, 24, 8, 14, 8);
  ctx.bezierCurveTo(4, 8, 4, 22, 4, 22);
  ctx.bezierCurveTo(4, 34, 18, 46, 32, 58);
  ctx.bezierCurveTo(46, 46, 60, 34, 60, 22);
  ctx.bezierCurveTo(60, 22, 60, 8, 50, 8);
  ctx.bezierCurveTo(40, 8, 32, 14, 32, 20);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function CupidotBot({
  state = 'idle',
  scale = 1.9,
  position = [0, -0.05, 0],
  interactive = true,
  className = '',
  style,
  onClick,
  showGlow = true,
  showParticles = true,
}: CupidotBotProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // References for animation loop
  const stateRef = useRef<BotState>(state);
  stateRef.current = state;

  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const modelRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<{
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let heartTex: THREE.CanvasTexture | null = null;

    try {
      // 1. Scene setup
      scene = new THREE.Scene();

      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;

      camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
      camera.position.set(0, 0.1, 2.5);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

      // 2. Soft romantic studio lighting
      const ambientLight = new THREE.AmbientLight(0xfff0f5, 0.85);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.8);
      keyLight.position.set(2, 3, 2.5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffa8c5, 1.3);
      fillLight.position.set(-2, 1, 1.5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffd166, 1.1);
      rimLight.position.set(0, 2.5, -2);
      scene.add(rimLight);

      lightsRef.current = { key: keyLight, fill: fillLight, rim: rimLight, ambient: ambientLight };

      // 3. Floating Heart Particles
      if (showParticles) {
        heartTex = createHeartTexture();
        const particleCount = 28;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);
        const alphas = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 1.2;
          positions[i * 3 + 1] = -0.5 + Math.random() * 1.2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          scales[i] = 0.04 + Math.random() * 0.05;
          alphas[i] = Math.random();
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          size: 0.12,
          map: heartTex,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);
        particlesRef.current = particles;
      }

      // 4. Load Cupidot 3D Model
      const loader = new GLTFLoader();
      loader.load(
        '/models/cupidot/cupidot.glb',
        (gltf) => {
          const model = gltf.scene;
          model.position.set(position[0], position[1], position[2]);
          model.scale.setScalar(scale);

          // Enhance materials with romantic soft glow
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.roughness = 0.38;
                mat.metalness = 0.08;
                mat.envMapIntensity = 1.0;
              }
            }
          });

          scene.add(model);
          modelRef.current = model;
          setLoading(false);
        },
        undefined,
        () => {
          setLoadError(true);
          setLoading(false);
        }
      );

      // 5. Mouse tracking events
      const handlePointerMove = (e: MouseEvent) => {
        if (!interactive) return;
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        mousePos.current.targetX = Math.max(-1, Math.min(1, nx));
        mousePos.current.targetY = Math.max(-1, Math.min(1, ny));
      };

      const handlePointerLeave = () => {
        mousePos.current.targetX = 0;
        mousePos.current.targetY = 0;
      };

      window.addEventListener('mousemove', handlePointerMove);
      container.addEventListener('mouseleave', handlePointerLeave);

      // 6. Resize handling
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // 7. Procedural Animation Clock & Loop
      const clock = new THREE.Clock();
      let spinProgress = 0;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        const currentState = stateRef.current;

        // Smooth mouse lerp
        mousePos.current.x = THREE.MathUtils.lerp(mousePos.current.x, mousePos.current.targetX, 0.06);
        mousePos.current.y = THREE.MathUtils.lerp(mousePos.current.y, mousePos.current.targetY, 0.06);

        const model = modelRef.current;
        if (model) {
          const baseY = position[1];
          const baseScale = scale;

          // State-specific procedural physics
          switch (currentState) {
            case 'happy': {
              // Bouncy pop & playful side wiggle
              const bounce = Math.abs(Math.sin(time * 6.0)) * 0.08;
              model.position.y = baseY + bounce;
              model.rotation.z = Math.sin(time * 5.0) * 0.08;
              model.scale.y = baseScale * (1 + Math.sin(time * 6.0) * 0.04);
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.45, 0.08);
              break;
            }

            case 'love': {
              // Leans forward toward viewer, deep heart pulsing
              model.position.y = baseY + Math.sin(time * 2.2) * 0.035;
              model.position.z = 0.12;
              model.rotation.x = -0.12 + Math.sin(time * 3.0) * 0.02;
              model.scale.setScalar(baseScale * (1 + Math.sin(time * 3.5) * 0.025));
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.35, 0.08);
              break;
            }

            case 'thinking': {
              // Curious head tilt, looks upward, thoughtful micro-bob
              model.position.y = baseY + Math.sin(time * 1.5) * 0.025;
              model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0.2, 0.05);
              model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, -0.15, 0.05);
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, -0.2, 0.05);
              break;
            }

            case 'talking': {
              // Expressive conversational head nodding & speech bounce
              model.position.y = baseY + Math.sin(time * 9.0) * 0.035;
              model.position.x = Math.sin(time * 4.5) * 0.015;
              model.rotation.x = Math.sin(time * 10.0) * 0.08;
              model.rotation.z = Math.sin(time * 5.0) * 0.04;
              model.scale.y = baseScale * (1 + Math.sin(time * 11.0) * 0.04);
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.5, 0.1);
              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#FFA8C5');
                lightsRef.current.key.color.set('#FFF8F0');
              }
              break;
            }

            case 'angry': {
              // Furious rapid jitter, aggressive forward stomp, indignant head jerks
              const jitterX = Math.sin(time * 38.0) * 0.016;
              const stompY = Math.abs(Math.sin(time * 18.0)) * 0.035;
              model.position.x = jitterX;
              model.position.y = baseY + stompY;
              model.position.z = 0.08;
              model.rotation.x = -0.22; // aggressive forward lean
              model.rotation.z = Math.sin(time * 20.0) * 0.12; // indignation head shake
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.5, 0.1);
              // Puff up in frustration
              model.scale.y = baseScale * (1 + Math.sin(time * 18.0) * 0.05);
              model.scale.x = baseScale * (1 - Math.sin(time * 18.0) * 0.03);
              model.scale.z = baseScale;

              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#FF1744');
                lightsRef.current.key.color.set('#FF6B8B');
              }
              break;
            }

            case 'sassy': {
              // Cheeky side head-tilt, chin forward, rhythmic sassy swagger
              model.position.x = Math.sin(time * 4.0) * 0.03;
              model.position.y = baseY + Math.sin(time * 8.0) * 0.025;
              model.position.z = 0.04;
              model.rotation.z = 0.22 + Math.sin(time * 4.0) * 0.06;
              model.rotation.x = -0.08 + Math.cos(time * 3.5) * 0.04;
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, -0.28 + mousePos.current.x * 0.4, 0.08);
              model.scale.setScalar(baseScale);

              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#FF7BA3');
                lightsRef.current.key.color.set('#FFF0F5');
              }
              break;
            }

            case 'shock': {
              // Dramatic recoil backward & upward, elongated shocked gasp posture
              model.position.y = baseY + 0.14 + Math.sin(time * 4.0) * 0.02;
              model.position.z = -0.16;
              model.position.x = Math.sin(time * 45.0) * 0.008; // high-speed shiver
              model.rotation.x = 0.18;
              model.rotation.z = Math.sin(time * 40.0) * 0.035;
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.2, 0.08);
              // Surprised vertical stretch
              model.scale.y = baseScale * 1.22;
              model.scale.x = baseScale * 0.86;
              model.scale.z = baseScale * 0.86;

              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#93C5FD');
                lightsRef.current.key.color.set('#FFFFFF');
              }
              break;
            }

            case 'pouty': {
              // Dejected forward slouch, looking away sulking like a cute toddler
              model.position.y = baseY - 0.05 + Math.sin(time * 1.5) * 0.015;
              model.position.z = 0;
              model.rotation.x = 0.24; // sad dropped head
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, 0.45 + Math.sin(time * 1.8) * 0.03, 0.06);
              model.rotation.z = -0.09;
              model.scale.y = baseScale * 0.94;
              model.scale.x = baseScale * 1.02;
              model.scale.z = baseScale;

              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#D1D5DB');
                lightsRef.current.key.color.set('#F3F4F6');
              }
              break;
            }

            case 'tweaking': {
              // Hyperactive erratic twitches, rapid snappy micro-rotations & frantic hops
              const tweakPhase = Math.floor(time * 14) % 4;
              const tweakTilt = tweakPhase === 0 ? 0.24 : tweakPhase === 1 ? -0.22 : tweakPhase === 2 ? 0.12 : -0.08;
              model.position.x = (Math.sin(time * 28.0) > 0.6 ? 0.02 : -0.02) * Math.random();
              model.position.y = baseY + Math.abs(Math.sin(time * 14.0)) * 0.08;
              model.rotation.z = tweakTilt + Math.sin(time * 30.0) * 0.08;
              model.rotation.x = Math.sin(time * 22.0) * 0.1;
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, mousePos.current.x * 0.6, 0.15);
              // Snappy squish-and-stretch
              model.scale.y = baseScale * (1 + (tweakPhase % 2 === 0 ? 0.1 : -0.08));
              model.scale.x = baseScale * (1 + (tweakPhase % 2 === 0 ? -0.08 : 0.08));
              model.scale.z = baseScale;

              if (lightsRef.current) {
                lightsRef.current.fill.color.set(tweakPhase % 2 === 0 ? '#FCD34D' : '#FF4D80');
                lightsRef.current.key.color.set('#FFFFFF');
              }
              break;
            }

            case 'sleeping': {
              // Slower 0.5x float, gentle forward droop, deep breathing
              model.position.y = baseY + Math.sin(time * 1.0) * 0.02;
              model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, 0.12, 0.04);
              model.rotation.z = Math.sin(time * 0.8) * 0.02;
              model.scale.y = baseScale * (1 + Math.sin(time * 1.2) * 0.02);
              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#9CA3AF');
                lightsRef.current.key.color.set('#E5E7EB');
              }
              break;
            }

            case 'celebration': {
              // Energetic double-jump & joyful 360 spin
              spinProgress += delta * 6.0;
              model.position.y = baseY + Math.abs(Math.sin(time * 7.0)) * 0.12;
              model.rotation.y = spinProgress;
              model.scale.setScalar(baseScale * (1 + Math.abs(Math.sin(time * 7.0)) * 0.05));
              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#FCD34D');
                lightsRef.current.key.color.set('#FFE082');
              }
              break;
            }

            case 'idle':
            default: {
              // Continuous organic floating & breathing
              model.position.y = baseY + Math.sin(time * 2.0) * 0.035;
              model.position.z = 0;
              model.scale.y = baseScale * (1 + Math.sin(time * 2.6) * 0.015);
              model.scale.x = baseScale;
              model.scale.z = baseScale;

              // Smooth cursor tracking
              const targetRotY = mousePos.current.x * 0.45;
              const targetRotX = -mousePos.current.y * 0.25;
              model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotY, 0.08);
              model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, targetRotX, 0.08);
              model.rotation.z = Math.sin(time * 1.4) * 0.025;

              if (lightsRef.current) {
                lightsRef.current.fill.color.set('#FFA8C5');
                lightsRef.current.key.color.set('#FFF8F0');
              }
              break;
            }
          }
        }

        // Animate floating heart particles
        const particles = particlesRef.current;
        if (particles) {
          const positions = particles.geometry.attributes.position.array as Float32Array;
          const count = positions.length / 3;
          const isHighEmission = currentState === 'love' || currentState === 'celebration' || currentState === 'happy';

          for (let i = 0; i < count; i++) {
            positions[i * 3 + 1] += (isHighEmission ? 0.008 : 0.003) + (i % 3) * 0.001;
            positions[i * 3] += Math.sin(time * 2.0 + i) * 0.002;

            // Reset when reaching top
            if (positions[i * 3 + 1] > 0.8) {
              positions[i * 3 + 1] = -0.5;
              positions[i * 3] = (Math.random() - 0.5) * 0.9;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
          (particles.material as THREE.PointsMaterial).opacity = isHighEmission ? 0.85 : 0.45;
        }

        renderer.render(scene, camera);
      };

      animate();

      // Cleanup on unmount
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handlePointerMove);
        container.removeEventListener('mouseleave', handlePointerLeave);
        resizeObserver.disconnect();

        if (renderer && renderer.domElement) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
        if (heartTex) heartTex.dispose();

        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--pink)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid rgba(255, 77, 128, 0.2)',
              borderTopColor: '#FF4D80',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Waking up Cupidot... ʚ💘ɞ</span>
        </div>
      )}

      {/* Fallback Display if WebGL is unavailable */}
      {loadError && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            color: 'var(--pink)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 800,
          }}
        >
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>ʚ🤖💘ɞ</span>
          <span>Cupidot 3D Ready</span>
        </div>
      )}

      {/* Soft Ambient Radial Floor Glow */}
      {showGlow && !loading && !loadError && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '24%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255, 123, 163, 0.35) 0%, rgba(255, 158, 100, 0.15) 50%, transparent 80%)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
}
