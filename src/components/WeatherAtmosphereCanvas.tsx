import {useEffect, useRef} from 'react';
import type {DayPhase, WeatherMood} from '../types/weather';

interface WeatherAtmosphereCanvasProps {
  mood: WeatherMood;
  dayPhase: DayPhase;
  windSpeed: number;
  theme: 'dark' | 'light';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

export function WeatherAtmosphereCanvas({
  mood,
  dayPhase,
  windSpeed,
  theme,
}: WeatherAtmosphereCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let flashOpacity = 0;
    let nextFlashAt = performance.now() + 4500;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const windBias = Math.min(4, windSpeed / 12);
    const count =
      mood === 'rain' || mood === 'storm'
        ? 90
        : mood === 'snow'
          ? 70
          : mood === 'fog' || mood === 'cloudy'
            ? 24
            : 45;

    const particles: Particle[] = Array.from({length: count}, () => {
      if (mood === 'rain' || mood === 'storm') {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 1.2 + windBias,
          vy: 11 + Math.random() * 5,
          size: 12 + Math.random() * 14,
          alpha: 0.14 + Math.random() * 0.22,
          phase: Math.random() * Math.PI * 2,
        };
      }
      if (mood === 'snow') {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.3) * 0.8 + windBias * 0.25,
          vy: 1.0 + Math.random() * 1.4,
          size: 1.6 + Math.random() * 2.8,
          alpha: 0.25 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
        };
      }
      if (mood === 'fog' || mood === 'cloudy') {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.8,
          vx: 0.25 + Math.random() * 0.35 + windBias * 0.08,
          vy: 0,
          size: 120 + Math.random() * 180,
          alpha: 0.03 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2,
        };
      }
      // clear (stars at night/dawn/dusk or subtle motes by day)
      return {
        x: Math.random() * width,
        y: Math.random() * height * 0.75,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.12,
        size: dayPhase === 'night' ? 1 + Math.random() * 1.6 : 1.5 + Math.random() * 2.5,
        alpha: 0.18 + Math.random() * 0.42,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const isLight = theme === 'light';

    const tick = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // Storm distant lightning pulse
      if (mood === 'storm') {
        if (now > nextFlashAt) {
          flashOpacity = 0.16;
          nextFlashAt = now + 4000 + Math.random() * 6500;
        }
        if (flashOpacity > 0.005) {
          ctx.fillStyle = `rgba(184, 61, 255, ${flashOpacity})`;
          ctx.fillRect(0, 0, width, height);
          flashOpacity *= 0.88;
        }
      }

      for (const p of particles) {
        p.phase += 0.02;

        if (mood === 'rain' || mood === 'storm') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > height) {
            p.y = -p.size;
            p.x = Math.random() * width;
          }
          if (p.x > width) p.x -= width;
          ctx.strokeStyle = isLight
            ? `rgba(152, 103, 217, ${p.alpha})`
            : `rgba(138, 180, 255, ${p.alpha})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.1, p.y + p.size);
          ctx.stroke();
        } else if (mood === 'snow') {
          p.x += p.vx + Math.sin(p.phase) * 0.4;
          p.y += p.vy;
          if (p.y > height) {
            p.y = -8;
            p.x = Math.random() * width;
          }
          if (p.x > width) p.x -= width;
          if (p.x < 0) p.x += width;
          ctx.fillStyle = isLight
            ? `rgba(180, 90, 130, ${p.alpha * 0.7})`
            : `rgba(244, 244, 248, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (mood === 'fog' || mood === 'cloudy') {
          p.x += p.vx;
          if (p.x - p.size > width) {
            p.x = -p.size;
          }
          const grad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.size);
          const rgb = isLight ? '237, 56, 109' : '185, 195, 225';
          grad.addColorStop(0, `rgba(${rgb}, ${p.alpha})`);
          grad.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // clear stars / sun motes
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height * 0.75;
          if (p.y > height * 0.75) p.y = 0;

          const twinkle = p.alpha * (0.65 + 0.35 * Math.sin(p.phase * 1.4));
          ctx.fillStyle = isLight
            ? `rgba(232, 50, 104, ${twinkle * 0.5})`
            : dayPhase === 'night'
              ? `rgba(244, 244, 250, ${twinkle})`
              : `rgba(255, 210, 230, ${twinkle * 0.65})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = window.requestAnimationFrame(tick);
    };

    animId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mood, dayPhase, windSpeed, theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  );
}
