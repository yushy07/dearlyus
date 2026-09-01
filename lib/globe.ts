/**
 * 3D Orthographic Globe & Geodesic Arc Renderer
 * Pure Canvas 2D spherical projection with day/night solar terminator and heartbeat wave pulses.
 */

export interface GlobeCity {
  name: string;
  lat: number;
  lng: number;
  color: string;
}

export function calculateGreatCircleDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export class InteractiveGlobe {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private radius: number;
  private rotationX = 0.2;
  private rotationY = 0.8;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private pulseProgress = 0;
  private animationId: number | null = null;
  public cityA: GlobeCity;
  public cityB: GlobeCity;

  constructor(canvas: HTMLCanvasElement, cityA: GlobeCity, cityB: GlobeCity) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.radius = Math.min(canvas.width, canvas.height) * 0.42;
    this.cityA = cityA;
    this.cityB = cityB;
    this.initEvents();
  }

  private initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.rotationY += dx * 0.008;
      this.rotationX -= dy * 0.008;
      this.rotationX = Math.max(-1.2, Math.min(1.2, this.rotationX));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  public triggerHeartbeatPulse() {
    this.pulseProgress = 0.01;
  }

  private project(lat: number, lng: number): { x: number; y: number; visible: boolean } {
    const phi = (lat * Math.PI) / 180;
    const theta = (lng * Math.PI) / 180 + this.rotationY;

    // 3D coordinates on unit sphere
    const x3 = Math.cos(phi) * Math.sin(theta);
    const y3 = Math.sin(phi);
    const z3 = Math.cos(phi) * Math.cos(theta);

    // Apply rotation around X axis (tilt)
    const yRot = y3 * Math.cos(this.rotationX) - z3 * Math.sin(this.rotationX);
    const zRot = y3 * Math.sin(this.rotationX) + z3 * Math.cos(this.rotationX);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    return {
      x: cx + x3 * this.radius,
      y: cy - yRot * this.radius,
      visible: zRot > -0.1,
    };
  }

  public draw() {
    const { ctx, canvas, radius } = this;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Globe Base Ocean Gradient
    const oceanGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    oceanGrad.addColorStop(0, '#1E2433');
    oceanGrad.addColorStop(0.7, '#13161F');
    oceanGrad.addColorStop(1, '#0C0E14');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Atmosphere Rim Glow
    ctx.strokeStyle = 'rgba(95, 160, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Graticule Lat/Lng Wireframe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 10) {
        const p = this.project(lat, lng);
        if (p.visible) {
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 45) {
      ctx.beginPath();
      let started = false;
      for (let lat = -80; lat <= 80; lat += 10) {
        const p = this.project(lat, lng);
        if (p.visible) {
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // 3. Geodesic Flight Arc between City A and City B
    const steps = 40;
    ctx.beginPath();
    ctx.strokeStyle = '#FFD68A';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);

    let arcStarted = false;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curLat = this.cityA.lat + (this.cityB.lat - this.cityA.lat) * t;
      const curLng = this.cityA.lng + (this.cityB.lng - this.cityA.lng) * t;
      const p = this.project(curLat, curLng);

      if (p.visible) {
        if (!arcStarted) {
          ctx.moveTo(p.x, p.y);
          arcStarted = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Heartbeat Pulse Wave Traveling along Arc
    if (this.pulseProgress > 0) {
      const curLat = this.cityA.lat + (this.cityB.lat - this.cityA.lat) * this.pulseProgress;
      const curLng = this.cityA.lng + (this.cityB.lng - this.cityA.lng) * this.pulseProgress;
      const pulsePoint = this.project(curLat, curLng);

      if (pulsePoint.visible) {
        ctx.beginPath();
        ctx.arc(pulsePoint.x, pulsePoint.y, 8 + Math.sin(this.pulseProgress * Math.PI) * 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 123, 163, 0.7)';
        ctx.fill();
      }

      this.pulseProgress += 0.02;
      if (this.pulseProgress > 1) this.pulseProgress = 0;
    }

    // 5. Draw City A and City B Pins
    [this.cityA, this.cityB].forEach((city) => {
      const p = this.project(city.lat, city.lng);
      if (p.visible) {
        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = city.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // City Name Tag
        ctx.font = 'bold 12px "Space Mono", monospace, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(city.name, p.x, p.y - 12);
      }
    });

    // Slow idle rotation when not dragging
    if (!this.isDragging) {
      this.rotationY += 0.0015;
    }
  }

  public start() {
    const loop = () => {
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
