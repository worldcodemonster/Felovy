'use client';

import { useEffect, useRef } from 'react';

interface Flower {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  baseOpacity: number;
  color: string;
  fadeStart: number;  // y fraction (0–1) at which fade begins
  fadeDuration: number; // y fraction over which it fully fades
}

const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#a855f7', '#d8b4fe', '#fecdd3'];

export function FlowerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowersRef = useRef<Flower[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    flowersRef.current = Array.from({ length: 55 }, () => createFlower(canvas));

    const drawFlower = (
      ctx: CanvasRenderingContext2D,
      flower: Flower,
    ) => {
      const { x, y, size, rotation, color } = flower;

      // Compute fade based on y position
      const yFrac = y / canvas.height;
      let alpha = flower.baseOpacity;
      if (yFrac >= flower.fadeStart) {
        const progress = Math.min(1, (yFrac - flower.fadeStart) / flower.fadeDuration);
        alpha = flower.baseOpacity * (1 - progress);
      }
      if (alpha <= 0) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;

      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 * i) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -size * 0.6, size * 0.3, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }

      // Center dot — reset blur so it stays crisp
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fef3c7';
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      flowersRef.current.forEach((f) => {
        f.x += f.speedX;
        f.y += f.speedY;
        f.rotation += f.rotationSpeed;

        // Respawn when fully faded out or off-screen
        const yFrac = f.y / canvas.height;
        const fullyFaded = yFrac >= f.fadeStart + f.fadeDuration;
        if (fullyFaded || f.y > canvas.height + 40) {
          Object.assign(f, createFlower(canvas, true));
        }

        drawFlower(ctx, f);
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}

function createFlower(canvas: HTMLCanvasElement, fromTop = false): Flower {
  const baseOpacity = 0.18 + Math.random() * 0.42;
  // Fade begins between 50%–70% down the screen, lasts 15%–30% of height
  const fadeStart = 0.5 + Math.random() * 0.2;
  const fadeDuration = 0.15 + Math.random() * 0.15;
  return {
    x: Math.random() * canvas.width,
    y: fromTop ? -50 : Math.random() * canvas.height,
    size: 6 + Math.random() * 18,
    speedX: (Math.random() - 0.5) * 0.35,
    speedY: 0.12 + Math.random() * 0.45,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.018,
    opacity: baseOpacity,
    baseOpacity,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    fadeStart,
    fadeDuration,
  };
}
