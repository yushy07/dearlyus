import * as THREE from 'three';

export function getSafePixelRatio(maximum = 1.75) {
  if (typeof window === 'undefined') return 1;
  const compact = window.matchMedia('(max-width: 760px)').matches;
  return Math.min(window.devicePixelRatio || 1, compact ? 1.25 : maximum);
}

export function configureDearlyRenderer(renderer: THREE.WebGLRenderer) {
  renderer.setPixelRatio(getSafePixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}

export function disposeThreeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

export function createSceneVisibilityController(
  element: HTMLElement,
  onVisibilityChange: (visible: boolean) => void,
) {
  let inViewport = true;
  let pageVisible = document.visibilityState === 'visible';
  const publish = () => onVisibilityChange(inViewport && pageVisible);
  const observer = new IntersectionObserver(
    ([entry]) => {
      inViewport = entry?.isIntersecting ?? false;
      publish();
    },
    { rootMargin: '120px' },
  );
  const handleDocumentVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    publish();
  };
  observer.observe(element);
  document.addEventListener('visibilitychange', handleDocumentVisibility);
  publish();
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', handleDocumentVisibility);
  };
}
