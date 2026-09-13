'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type BottleSpinnerProps = {
  finalRotationDegrees: number;
  spinId?: string;
  spinning: boolean;
  reducedMotion?: boolean;
};

export function BottleSpinner({
  finalRotationDegrees,
  spinId,
  spinning,
  reducedMotion,
}: BottleSpinnerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rotationRef = useRef(0);
  const targetRef = useRef(0);
  const spinningRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 6.6, 0.01);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff6e7, 0x4b2632, 2.5));
    const key = new THREE.DirectionalLight(0xffe5c7, 4.2);
    key.position.set(-3, 6, 4);
    key.castShadow = true;
    scene.add(key);
    const warm = new THREE.PointLight(0xc98778, 15, 10);
    warm.position.set(3, 2.5, -2);
    scene.add(warm);

    const bottle = new THREE.Group();
    bottle.rotation.order = 'YXZ';
    bottle.position.y = 0.22;
    scene.add(bottle);
    groupRef.current = bottle;

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x687b61,
      roughness: 0.18,
      metalness: 0.03,
      transmission: 0.42,
      transparent: true,
      opacity: 0.9,
      thickness: 0.7,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });
    const darkGlass = glass.clone();
    darkGlass.color.setHex(0x405640);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.48, 1.72, 12, 28),
      glass,
    );
    body.rotation.z = Math.PI / 2;
    body.position.x = -0.12;
    body.castShadow = true;
    body.receiveShadow = true;
    bottle.add(body);

    const shoulder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.43, 0.48, 32),
      darkGlass,
    );
    shoulder.rotation.z = -Math.PI / 2;
    shoulder.position.x = 1.06;
    shoulder.castShadow = true;
    bottle.add(shoulder);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.27, 0.72, 28),
      darkGlass,
    );
    neck.rotation.z = -Math.PI / 2;
    neck.position.x = 1.62;
    neck.castShadow = true;
    bottle.add(neck);

    const lip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.18, 28),
      darkGlass,
    );
    lip.rotation.z = -Math.PI / 2;
    lip.position.x = 2.06;
    bottle.add(lip);

    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.19, 0.34, 24),
      new THREE.MeshStandardMaterial({ color: 0x9a7354, roughness: 0.92 }),
    );
    cork.rotation.z = -Math.PI / 2;
    cork.position.x = 2.23;
    cork.castShadow = true;
    bottle.add(cork);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0xf5e7d1,
        roughness: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(-0.22, 0.5, 0);
    bottle.add(label);
    const heart = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 32),
      new THREE.MeshStandardMaterial({ color: 0x82495a, roughness: 0.65 }),
    );
    heart.rotation.x = -Math.PI / 2;
    heart.position.set(-0.22, 0.512, 0);
    heart.scale.set(1, 0.86, 1);
    bottle.add(heart);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(2.15, 64),
      new THREE.ShadowMaterial({ color: 0x291820, opacity: 0.22 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.03;
    shadow.receiveShadow = true;
    scene.add(shadow);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let previous = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (spinningRef.current) {
        const distance = targetRef.current - rotationRef.current;
        rotationRef.current +=
          distance * Math.min(1, dt * (Math.abs(distance) > 2 ? 1.5 : 4.5));
        if (Math.abs(distance) < 0.008) {
          rotationRef.current = targetRef.current;
          spinningRef.current = false;
        }
      }
      bottle.rotation.y = rotationRef.current;
      bottle.position.y =
        0.22 + (spinningRef.current ? Math.sin(now * 0.012) * 0.025 : 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      groupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const radians = THREE.MathUtils.degToRad(finalRotationDegrees);
    targetRef.current = reducedMotion ? radians % (Math.PI * 2) : radians;
    spinningRef.current = spinning;
    if (!spinning) rotationRef.current = targetRef.current;
  }, [finalRotationDegrees, spinId, spinning, reducedMotion]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={
        spinning
          ? 'The glass bottle is spinning'
          : 'A glass bottle rests on the table'
      }
    />
  );
}
