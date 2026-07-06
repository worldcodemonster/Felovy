'use client';

import { useEffect, useRef } from 'react';
import {
  AGENT_STATE_COLORS,
  AGENT_STATE_SECONDARY,
  type AgentCharacterState,
} from '@/config/agent.config';

export type CharacterState = AgentCharacterState;

interface Props {
  state?: CharacterState;
  width?: number;
  height?: number;
  variant?: 'portrait' | 'mini';
}

interface SphereParticle {
  x: number;
  y: number;
  z: number;
  velX: number;
  velY: number;
  velZ: number;
  age: number;
  dead: boolean;
  attack: number;
  hold: number;
  decay: number;
  initValue: number;
  holdValue: number;
  lastValue: number;
  stuckTime: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  alpha: number;
  projX: number;
  projY: number;
  prev: SphereParticle | null;
  next: SphereParticle | null;
}

interface ParticleList {
  first: SphereParticle | null;
}

const SPHERE_RADIUS = 28;
const PARTICLE_RADIUS = { mini: 1.1, portrait: 1.6 } as const;

const STATE_TUNING: Record<
  CharacterState,
  { turnSpeed: number; spawnRate: number; spawnCount: number; particleAlpha: number; radiusMul: number }
> = {
  idle: { turnSpeed: 1, spawnRate: 1, spawnCount: 8, particleAlpha: 1, radiusMul: 1 },
  greeting: { turnSpeed: 1.35, spawnRate: 0.75, spawnCount: 10, particleAlpha: 1, radiusMul: 1.02 },
  thinking: { turnSpeed: 0.55, spawnRate: 1.2, spawnCount: 6, particleAlpha: 0.9, radiusMul: 0.98 },
  happy: { turnSpeed: 1.5, spawnRate: 0.65, spawnCount: 11, particleAlpha: 1, radiusMul: 1.05 },
};

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function VirtualAgentOrb({
  state = 'idle',
  width = 68,
  height = 68,
  variant = 'portrait',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const rafRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = width;
    const displayHeight = height;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dim = Math.min(displayWidth, displayHeight);
    const baseScale = dim / 68;
    const clipR = dim / 2;

    let sphereRad = SPHERE_RADIUS * baseScale;
    const radiusSp = 1;
    const particleRad = PARTICLE_RADIUS[variant] * baseScale;
    const fLen = 110 * baseScale;
    const projCenterX = displayWidth / 2;
    const projCenterY = displayHeight / 2;
    const zMax = fLen - 2;
    const zeroAlphaDepth = -sphereRad * 2.68;
    const sphereCenterX = 0;
    const sphereCenterY = 0;
    let sphereCenterZ = -3 - sphereRad;

    const randAccelX = 0.1;
    const randAccelY = 0.1;
    const randAccelZ = 0.1;
    const gravity = 0;

    const particleList: ParticleList = { first: null };
    const recycleBin: ParticleList = { first: null };

    let turnAngle = 0;
    const baseTurnSpeed = (2 * Math.PI) / 1200;

    let wait = 1;
    let count = 0;
    let particleAlpha = 1;

    let r = 225;
    let g = 29;
    let b = 72;
    let rgbString = `rgba(${r},${g},${b},`;

    let smoothR = r;
    let smoothG = g;
    let smoothB = b;

    function addParticle(x0: number, y0: number, z0: number, vx0: number, vy0: number, vz0: number) {
      let newParticle: SphereParticle;

      if (recycleBin.first) {
        newParticle = recycleBin.first;
        if (newParticle.next) {
          recycleBin.first = newParticle.next;
          newParticle.next.prev = null;
        } else {
          recycleBin.first = null;
        }
      } else {
        newParticle = {
          x: 0, y: 0, z: 0, velX: 0, velY: 0, velZ: 0,
          age: 0, dead: false,
          attack: 0, hold: 0, decay: 0,
          initValue: 0, holdValue: 0, lastValue: 0,
          stuckTime: 0, accelX: 0, accelY: 0, accelZ: 0,
          alpha: 0, projX: 0, projY: 0,
          prev: null, next: null,
        };
      }

      if (!particleList.first) {
        particleList.first = newParticle;
        newParticle.prev = null;
        newParticle.next = null;
      } else {
        newParticle.next = particleList.first;
        particleList.first.prev = newParticle;
        particleList.first = newParticle;
        newParticle.prev = null;
      }

      newParticle.x = x0;
      newParticle.y = y0;
      newParticle.z = z0;
      newParticle.velX = vx0;
      newParticle.velY = vy0;
      newParticle.velZ = vz0;
      newParticle.age = 0;
      newParticle.dead = false;

      return newParticle;
    }

    function recycle(p: SphereParticle) {
      if (particleList.first === p) {
        if (p.next) {
          p.next.prev = null;
          particleList.first = p.next;
        } else {
          particleList.first = null;
        }
      } else if (p.prev) {
        if (p.next) {
          p.prev.next = p.next;
          p.next.prev = p.prev;
        } else {
          p.prev.next = null;
        }
      }

      if (!recycleBin.first) {
        recycleBin.first = p;
        p.prev = null;
        p.next = null;
      } else {
        p.next = recycleBin.first;
        recycleBin.first.prev = p;
        recycleBin.first = p;
        p.prev = null;
      }
    }

    const seedParticles = () => {
      for (let i = 0; i < 24; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
        const y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
        const z0 = sphereRad * Math.cos(phi);
        const p = addParticle(
          x0,
          sphereCenterY + y0,
          sphereCenterZ + z0,
          0.002 * x0,
          0.002 * y0,
          0.002 * z0,
        );
        p.attack = 30;
        p.hold = 80;
        p.decay = 100;
        p.initValue = 0;
        p.holdValue = particleAlpha;
        p.lastValue = 0;
        p.stuckTime = 60 + Math.random() * 40;
        p.accelX = 0;
        p.accelY = gravity;
        p.accelZ = 0;
        p.age = Math.floor(Math.random() * 40);
      }
    };

    seedParticles();

    const frame = () => {
      const current = stateRef.current;
      const tune = STATE_TUNING[current];
      const primary = hexToRgb(AGENT_STATE_COLORS[current]);
      const secondary = hexToRgb(AGENT_STATE_SECONDARY[current]);
      const targetR = lerp(primary.r, secondary.r, 0.35);
      const targetG = lerp(primary.g, secondary.g, 0.35);
      const targetB = lerp(primary.b, secondary.b, 0.35);

      smoothR = lerp(smoothR, targetR, 0.06);
      smoothG = lerp(smoothG, targetG, 0.06);
      smoothB = lerp(smoothB, targetB, 0.06);

      r = smoothR | 0;
      g = smoothG | 0;
      b = smoothB | 0;
      rgbString = `rgba(${r},${g},${b},`;

      sphereRad = SPHERE_RADIUS * baseScale * tune.radiusMul;
      sphereCenterZ = -3 - sphereRad;
      particleAlpha = tune.particleAlpha;

      const turnSpeed = baseTurnSpeed * tune.turnSpeed;
      const numToAddEachFrame = tune.spawnCount;
      wait = Math.max(1, Math.round(1 * tune.spawnRate));

      count++;
      if (count >= wait) {
        count = 0;
        for (let i = 0; i < numToAddEachFrame; i++) {
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(Math.random() * 2 - 1);
          const x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
          const y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
          const z0 = sphereRad * Math.cos(phi);

          const p = addParticle(
            x0,
            sphereCenterY + y0,
            sphereCenterZ + z0,
            0.002 * x0,
            0.002 * y0,
            0.002 * z0,
          );

          p.attack = 50;
          p.hold = 50;
          p.decay = 100;
          p.initValue = 0;
          p.holdValue = particleAlpha;
          p.lastValue = 0;
          p.stuckTime = 90 + Math.random() * 20;
          p.accelX = 0;
          p.accelY = gravity;
          p.accelZ = 0;
        }
      }

      turnAngle = (turnAngle + turnSpeed) % (2 * Math.PI);
      const sinAngle = Math.sin(turnAngle);
      const cosAngle = Math.cos(turnAngle);

      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.save();
      ctx.beginPath();
      ctx.arc(projCenterX, projCenterY, clipR, 0, 2 * Math.PI);
      ctx.clip();

      let p = particleList.first;
      while (p) {
        const nextParticle = p.next;
        p.age++;

        if (p.age > p.stuckTime) {
          p.velX += p.accelX + randAccelX * (Math.random() * 2 - 1);
          p.velY += p.accelY + randAccelY * (Math.random() * 2 - 1);
          p.velZ += p.accelZ + randAccelZ * (Math.random() * 2 - 1);
          p.x += p.velX;
          p.y += p.velY;
          p.z += p.velZ;
        }

        const rotX = cosAngle * p.x + sinAngle * (p.z - sphereCenterZ);
        const rotZ = -sinAngle * p.x + cosAngle * (p.z - sphereCenterZ) + sphereCenterZ;
        const m = radiusSp * fLen / (fLen - rotZ);
        p.projX = rotX * m + projCenterX;
        p.projY = p.y * m + projCenterY;

        if (p.age < p.attack + p.hold + p.decay) {
          if (p.age < p.attack) {
            p.alpha = ((p.holdValue - p.initValue) / p.attack) * p.age + p.initValue;
          } else if (p.age < p.attack + p.hold) {
            p.alpha = p.holdValue;
          } else {
            p.alpha =
              ((p.lastValue - p.holdValue) / p.decay) * (p.age - p.attack - p.hold) + p.holdValue;
          }
        } else {
          p.dead = true;
        }

        const outsideTest =
          p.projX > displayWidth ||
          p.projX < 0 ||
          p.projY < 0 ||
          p.projY > displayHeight ||
          rotZ > zMax;

        if (outsideTest || p.dead) {
          recycle(p);
        } else {
          let depthAlphaFactor = 1 - rotZ / zeroAlphaDepth;
          depthAlphaFactor = depthAlphaFactor > 1 ? 1 : depthAlphaFactor < 0 ? 0 : depthAlphaFactor;
          ctx.fillStyle = rgbString + depthAlphaFactor * p.alpha + ')';
          const drawR = Math.max(1, m * particleRad);
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, drawR, 0, 2 * Math.PI, false);
          ctx.closePath();
          ctx.fill();
        }

        p = nextParticle;
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, variant]);

  return (
    <div
      className="overflow-hidden rounded-full pointer-events-none"
      style={{ width, height }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="block pointer-events-none"
        style={{ width, height }}
      />
    </div>
  );
}
