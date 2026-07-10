'use client';

import { useEffect, useRef, useCallback } from 'react';

export type BgVariant =
  | 'particles'
  | 'neural'
  | 'waves'
  | 'grid'
  | 'bubbles'
  | 'rings'
  | 'flow'
  | 'hex'
  | 'matrix'
  | 'constellation'
  | 'spiral';

interface Props {
  variant: BgVariant;
  opacity?: number;
  color?: string;
  secondary?: string;
  className?: string;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function AnimatedSectionBg({
  variant,
  opacity = 0.05,
  color = '#15803d',
  secondary = '#22c55e',
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const c1 = hexToRgb(color);
    const c2 = hexToRgb(secondary);
    let t = 0;

    const rgba = (c: { r: number; g: number; b: number }, a: number) =>
      `rgba(${c.r},${c.g},${c.b},${a})`;

    if (variant === 'particles') {
      const pts = Array.from({ length: 55 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2.5 + 1,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c1, opacity);
          ctx.fill();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'neural' || variant === 'constellation') {
      const nodes = Array.from({ length: 45 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        nodes.forEach(n => {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
        });
        nodes.forEach((a, i) => {
          nodes.slice(i + 1).forEach(b => {
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 160) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = rgba(c1, opacity * (1 - d / 160));
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          });
        });
        nodes.forEach(n => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c1, opacity * 2.5);
          ctx.fill();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'waves') {
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        t += 0.012;
        [0, 1, 2].forEach(i => {
          const cc = i === 1 ? c2 : c1;
          ctx.beginPath();
          ctx.moveTo(0, H / 2);
          for (let x = 0; x <= W; x += 4) {
            const y = H / 2 + Math.sin((x / W) * Math.PI * 5 + t + i * 1.8) * (H / 5 - i * 20);
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = rgba(cc, opacity * (1 - i * 0.25));
          ctx.lineWidth = 1.5 - i * 0.3;
          ctx.stroke();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'grid') {
      const sz = 48;
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        t += 0.006;
        for (let x = 0; x <= W; x += sz) {
          const p = Math.sin(t * 2 + x / 120) * 0.5 + 0.5;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H);
          ctx.strokeStyle = rgba(c1, opacity * p);
          ctx.lineWidth = 0.5; ctx.stroke();
        }
        for (let y = 0; y <= H; y += sz) {
          const p = Math.sin(t * 2 + y / 120) * 0.5 + 0.5;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
          ctx.strokeStyle = rgba(c2, opacity * p * 0.7);
          ctx.lineWidth = 0.5; ctx.stroke();
        }
        // Pulsing intersections
        for (let x = 0; x <= W; x += sz) {
          for (let y = 0; y <= H; y += sz) {
            const p = Math.sin(t * 3 + x / 60 + y / 60) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, p * 2 + 0.5, 0, Math.PI * 2);
            ctx.fillStyle = rgba(c1, opacity * p * 2);
            ctx.fill();
          }
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'bubbles') {
      const bubs = Array.from({ length: 22 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H + H,
        r: Math.random() * 28 + 8,
        spd: Math.random() * 0.6 + 0.2,
        o: Math.random() * opacity,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        bubs.forEach(b => {
          b.y -= b.spd;
          if (b.y + b.r < 0) { b.y = H + b.r; b.x = Math.random() * W; }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(c1, b.o);
          ctx.lineWidth = 1;
          ctx.stroke();
          // Inner glow
          ctx.beginPath();
          ctx.arc(b.x, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = rgba(c1, b.o * 0.3);
          ctx.fill();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'rings') {
      const rings = Array.from({ length: 6 }, (_, i) => ({
        x: W * (0.15 + i * 0.13),
        y: H * (0.2 + (i % 3) * 0.3),
        r: 0, maxR: 60 + i * 25, spd: 0.4 + i * 0.08,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        rings.forEach(ring => {
          ring.r += ring.spd;
          if (ring.r > ring.maxR) ring.r = 0;
          const alpha = (1 - ring.r / ring.maxR) * opacity;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(c1, alpha);
          ctx.lineWidth = 1.5; ctx.stroke();
          // Lagging ring
          const r2 = (ring.r + ring.maxR / 2) % ring.maxR;
          const a2 = (1 - r2 / ring.maxR) * opacity * 0.5;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, r2, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(c2, a2);
          ctx.lineWidth = 1; ctx.stroke();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'flow') {
      const streamers = Array.from({ length: 28 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        len: Math.random() * 70 + 20,
        spd: Math.random() * 1.2 + 0.4,
        angle: Math.random() * Math.PI * 2,
      }));
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        t += 0.01;
        streamers.forEach(s => {
          const noise = Math.sin(s.x / 180 + t) * Math.cos(s.y / 130 + t * 0.8);
          s.angle += noise * 0.06;
          s.x += Math.cos(s.angle) * s.spd;
          s.y += Math.sin(s.angle) * s.spd;
          if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
          if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
          const tx = s.x - Math.cos(s.angle) * s.len;
          const ty = s.y - Math.sin(s.angle) * s.len;
          const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
          g.addColorStop(0, rgba(c1, 0));
          g.addColorStop(1, rgba(c1, opacity * 2));
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'hex') {
      const sz = 38;
      const hh = sz * Math.sqrt(3);
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        t += 0.006;
        for (let row = -1; row < H / hh + 2; row++) {
          for (let col = -1; col < W / (sz * 1.5) + 2; col++) {
            const x = col * sz * 1.5;
            const y = row * hh + (col % 2 === 0 ? 0 : hh / 2);
            const p = Math.sin(t + col * 0.6 + row * 0.4) * 0.5 + 0.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              const px = x + sz * 0.85 * Math.cos(a);
              const py = y + sz * 0.85 * Math.sin(a);
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = rgba(c1, opacity * p);
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'matrix') {
      const cols = Math.floor(W / 18);
      const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * H / 14) * 14);
      const draw = () => {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = '11px monospace';
        drops.forEach((y, i) => {
          const ch = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
          const fade = Math.random();
          ctx.fillStyle = rgba(c1, opacity * fade * 3);
          ctx.fillText(ch, i * 18, y);
          drops[i] = y > H + 14 && Math.random() > 0.97 ? 0 : y + 14;
        });
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }

    else if (variant === 'spiral') {
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        t += 0.008;
        const cx = W / 2, cy = H / 2;
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          const armOffset = (arm / 3) * Math.PI * 2;
          for (let i = 0; i < 400; i++) {
            const angle = i * 0.04 + t + armOffset;
            const r = i * 0.55;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            const alpha = (i / 400) * opacity * 1.5;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            if (i > 0) {
              ctx.strokeStyle = rgba(arm === 1 ? c2 : c1, alpha);
              ctx.lineWidth = 0.8;
            }
          }
          ctx.stroke();
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    }
  }, [variant, opacity, color, secondary]);

  useEffect(() => {
    startAnimation();
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      startAnimation();
    });

    // Pause when off-screen for performance
    const vis = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) cancelAnimationFrame(rafRef.current);
      else startAnimation();
    }, { threshold: 0 });

    if (canvas?.parentElement) {
      observer.observe(canvas.parentElement);
      vis.observe(canvas.parentElement);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      vis.disconnect();
    };
  }, [startAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
