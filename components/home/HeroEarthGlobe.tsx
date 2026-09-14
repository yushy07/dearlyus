'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  generateEarthTexture,
  generateCloudTexture,
  latLngToVector3,
  createGeodesicPoints,
} from '@/lib/earth-data';
import {
  configureDearlyRenderer,
  createSceneVisibilityController,
  disposeThreeObject,
} from '@/lib/three-scene-lifecycle';

interface HeroEarthGlobeProps {
  cityA?: string;
  cityB?: string;
  partnerA?: string;
  partnerB?: string;
}

export function HeroEarthGlobe({
  cityA = 'Calgary',
  cityB = 'Jakarta',
  partnerA = 'Mia',
  partnerB = 'Alex',
}: HeroEarthGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const dragVelocity = useRef({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  // Calgary & Jakarta Geo Coordinates
  const calgaryCoords = { lat: 51.0447, lng: -114.0719 };
  const jakartaCoords = { lat: -6.2088, lng: 106.8456 };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 560;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    configureDearlyRenderer(renderer);
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.borderRadius = '50%';
    container.appendChild(renderer.domElement);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // Daylight with a warm evening rim keeps the Earth natural inside the scene.
    const sunLight = new THREE.DirectionalLight(0xfff4df, 2.85);
    sunLight.position.set(-4.5, 4.0, 3.8);
    scene.add(sunLight);

    const ambientLight = new THREE.HemisphereLight(0xbfe2f0, 0x172b35, 1.45);
    scene.add(ambientLight);

    const rimLight = new THREE.PointLight(0xe3a7aa, 5.5, 14);
    rimLight.position.set(4, -2.5, 2.0);
    scene.add(rimLight);

    // 4. Stardust Particles in surrounding cosmos
    const starsCount = 140;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      // Form a halo ring outside the globe perimeter
      const radius = 2.4 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 2.0 - 0.8;

      starPositions[i * 3] = Math.cos(angle) * radius;
      starPositions[i * 3 + 1] = Math.sin(angle) * radius;
      starPositions[i * 3 + 2] = z;

      // Soft warm blush / champagne / starlight colors
      const isWarm = Math.random() > 0.5;
      starColors[i * 3] = isWarm ? 0.96 : 0.75;
      starColors[i * 3 + 1] = isWarm ? 0.82 : 0.82;
      starColors[i * 3 + 2] = isWarm ? 0.85 : 0.98;
    }

    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3),
    );
    starGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(starColors, 3),
    );

    const starMaterial = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 5. Earth Axial Tilt Group (Earth tilted at 23.4 degrees)
    const earthRadius = 1.95;
    const tiltGroup = new THREE.Group();
    // 23.4 degrees = ~0.409 rad
    tiltGroup.rotation.z = 0.409;
    tiltGroup.rotation.x = 0.12;
    scene.add(tiltGroup);

    // Earth Sphere Texture Generation
    const earthCanvas = generateEarthTexture(2048, 1024);
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.wrapS = THREE.RepeatWrapping;

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.82,
      metalness: 0,
      emissive: new THREE.Color(0x06283a),
      emissiveIntensity: 0.09,
    });

    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    tiltGroup.add(earthMesh);

    // Atmosphere Cloud Layer
    const cloudCanvas = generateCloudTexture(1024, 512);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.wrapS = THREE.RepeatWrapping;

    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.24,
      roughness: 1,
      metalness: 0,
    });

    const cloudGeometry = new THREE.SphereGeometry(earthRadius * 1.018, 48, 48);
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    tiltGroup.add(cloudMesh);

    // Ethereal Atmosphere Glow Mesh (Outer Silhouette Glow)
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ed8eb,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius * 1.12, 48, 48),
      atmosphereMaterial,
    );
    scene.add(atmosphereMesh);

    // Outer Sky Blue Halo
    const outerHaloMaterial = new THREE.MeshBasicMaterial({
      color: 0xb9e8f2,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const outerHaloMesh = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius * 1.22, 48, 48),
      outerHaloMaterial,
    );
    scene.add(outerHaloMesh);

    // 6. A quiet shared-world thread between both partners.
    // Calgary & Jakarta on Earth's surface (attached directly to earthMesh so they rotate with the Earth)
    const calgaryPos = latLngToVector3(
      calgaryCoords.lat,
      calgaryCoords.lng,
      earthRadius,
    );
    const jakartaPos = latLngToVector3(
      jakartaCoords.lat,
      jakartaCoords.lng,
      earthRadius,
    );

    // Arc points curve high over the Pacific
    const arcPoints = createGeodesicPoints(
      calgaryCoords.lat,
      calgaryCoords.lng,
      jakartaCoords.lat,
      jakartaCoords.lng,
      earthRadius,
      0.35, // altitude lift
      100,
    );

    const arcCurve = new THREE.CatmullRomCurve3(arcPoints);
    const arcGeometry = new THREE.TubeGeometry(arcCurve, 80, 0.016, 8, false);

    // Rose-to-gold connection thread; it represents presence rather than travel.
    const count = arcGeometry.attributes.position.count;
    const arcColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = i / count;
      if (u < 0.5) {
        // Rose to Gold
        const t = u * 2;
        arcColors[i * 3] = 0.96 * (1 - t) + 1.0 * t; // R
        arcColors[i * 3 + 1] = 0.45 * (1 - t) + 0.84 * t; // G
        arcColors[i * 3 + 2] = 0.71 * (1 - t) + 0.54 * t; // B
      } else {
        // Gold to Sky Blue
        const t = (u - 0.5) * 2;
        arcColors[i * 3] = 1.0 * (1 - t) + 0.38 * t; // R
        arcColors[i * 3 + 1] = 0.84 * (1 - t) + 0.65 * t; // G
        arcColors[i * 3 + 2] = 0.54 * (1 - t) + 0.98 * t; // B
      }
    }
    arcGeometry.setAttribute('color', new THREE.BufferAttribute(arcColors, 3));

    const arcMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    });
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
    earthMesh.add(arcMesh);

    // Helper: Create City Marker Pin & Pulsing Rings
    function createCityMarker(pos: THREE.Vector3, colorHex: number) {
      const group = new THREE.Group();
      group.position.copy(pos);
      group.lookAt(pos.clone().multiplyScalar(2));

      // Core bead
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 16, 16),
        new THREE.MeshBasicMaterial({ color: colorHex }),
      );
      group.add(bead);

      // Inner white eye
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      eye.position.z = 0.02;
      group.add(eye);

      // Radar pulse ring
      const ringGeo = new THREE.RingGeometry(0.048, 0.068, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);

      return { group, ring };
    }

    const calgaryMarker = createCityMarker(calgaryPos, 0xf472b6); // Rose
    earthMesh.add(calgaryMarker.group);

    const jakartaMarker = createCityMarker(jakartaPos, 0x60a5fa); // Sky blue
    earthMesh.add(jakartaMarker.group);

    // Initial orientation: Orient Pacific and cities gracefully towards camera
    earthMesh.rotation.y = 1.35;

    // 7. Interaction: Mouse & Touch Dragging
    const onPointerDown = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      lastMousePos.current = { x: clientX, y: clientY };
      dragVelocity.current = { x: 0, y: 0 };
      setIsInteracting(true);
    };

    const onPointerMove = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const dx = clientX - lastMousePos.current.x;
      const dy = clientY - lastMousePos.current.y;

      // Rotate Earth around Y axis (longitude) and slight tilt adjustment
      earthMesh.rotation.y += dx * 0.007;
      tiltGroup.rotation.x += dy * 0.004;
      // Clamp vertical tilt so Earth doesn't flip upside down
      tiltGroup.rotation.x = Math.max(
        -0.6,
        Math.min(0.6, tiltGroup.rotation.x),
      );

      dragVelocity.current = { x: dx * 0.007, y: dy * 0.004 };
      lastMousePos.current = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setIsInteracting(false);
    };

    // DOM Event Listeners
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      onPointerDown(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent) => {
      onPointerMove(e.clientX, e.clientY);
    };
    const handleMouseUp = () => onPointerUp();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onPointerUp();

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // 8. Render & Animation Loop
    let isVisible = true;
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      time += 0.016;

      // Constant natural Earth rotation (West to East)
      if (!isDraggingRef.current) {
        // Inertia damping
        if (Math.abs(dragVelocity.current.x) > 0.0001) {
          earthMesh.rotation.y += dragVelocity.current.x;
          dragVelocity.current.x *= 0.94;
        } else {
          // Continuous Earth spin (just like real Earth!)
          if (!prefersReducedMotion) earthMesh.rotation.y += 0.00135;
        }

        if (Math.abs(dragVelocity.current.y) > 0.0001) {
          tiltGroup.rotation.x += dragVelocity.current.y;
          tiltGroup.rotation.x = Math.max(
            -0.6,
            Math.min(0.6, tiltGroup.rotation.x),
          );
          dragVelocity.current.y *= 0.94;
        }
      }

      // Clouds rotate slightly faster for realistic atmospheric drift
      cloudMesh.rotation.y = earthMesh.rotation.y * 1.06;

      // Radar pulses at Calgary and Jakarta markers
      const pulseScale = 1 + (Math.sin(time * 3.5) * 0.5 + 0.5) * 0.6;
      calgaryMarker.ring.scale.set(pulseScale, pulseScale, 1);
      jakartaMarker.ring.scale.set(pulseScale, pulseScale, 1);

      // Slow twinkle of cosmos stars
      stars.rotation.y = time * 0.015;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 9. Scene Visibility Controller (Pause when off-screen)
    const cleanupVisibility = createSceneVisibilityController(
      container,
      (visible) => {
        isVisible = visible;
      },
    );

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      cleanupVisibility();
      resizeObserver.disconnect();

      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      disposeThreeObject(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [
    calgaryCoords.lat,
    calgaryCoords.lng,
    jakartaCoords.lat,
    jakartaCoords.lng,
  ]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* Three.js 3D WebGL Canvas Host */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isInteracting ? 'grabbing' : 'grab',
          position: 'relative',
        }}
        title="Interactive 3D Earth Globe · Drag to spin"
        aria-label={`Rotating interactive Earth showing ${cityA} and ${cityB} connected under one sky`}
      />

      {/* Shared-world status */}
      <div
        style={{
          position: 'absolute',
          bottom: '22px',
          zIndex: 8,
          background: 'rgba(27, 20, 29, 0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(244, 114, 182, 0.28)',
          borderRadius: '9999px',
          padding: '6px 16px',
          boxShadow:
            '0 8px 32px rgba(0, 0, 0, 0.38), 0 0 16px rgba(244, 114, 182, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#fdf2f8',
          letterSpacing: '0.01em',
          transition: 'all 0.25s ease',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#F472B6',
            boxShadow: '0 0 8px #F472B6',
          }}
        />
        <span>
          ♥ Two places, one shared world · {cityA} &amp; {cityB}
        </span>
        <span
          style={{
            color: 'rgba(255, 214, 138, 0.9)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            paddingLeft: '4px',
            borderLeft: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          Drag to spin ↻
        </span>
      </div>
    </div>
  );
}
