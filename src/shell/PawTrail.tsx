import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../lib/media-query';
import { PAW_PATH } from '../lib/paw';

interface PawPrint {
  x: number;
  y: number;
  angle: number;
  born: number;
}

const STEP = 46; // px of mouse travel between prints
const SIDE = 7; // px each print is offset left / right of the path
const SCALE = 0.27;
const HOLD = 600; // ms fully visible
const FADE = 400; // ms fading out
const MAX_PRINTS = 14;

/**
 * Paw prints that trail the mouse cursor, drawn on one full-screen canvas.
 * Mouse only: touch devices and reduced-motion users never get it. The canvas
 * redraws only while prints are on screen.
 */
export function PawTrail() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const element = canvas.current!;
    const context = element.getContext('2d')!;
    const paw = new Path2D(PAW_PATH);
    const prints: PawPrint[] = [];
    let ratio = 1;
    let frame = 0;
    let drawing = false;
    let lastX = NaN;
    let lastY = NaN;
    let travelled = 0;
    let side = 1;

    const resize = () => {
      ratio = Math.min(devicePixelRatio || 1, 2); // cap for very dense screens
      element.width = innerWidth * ratio;
      element.height = innerHeight * ratio;
    };
    resize();

    const clear = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, element.width, element.height);
    };

    const draw = (now: number) => {
      clear();
      for (let i = prints.length - 1; i >= 0; i--) {
        const print = prints[i];
        const age = now - print.born;
        if (age > HOLD + FADE) {
          prints.splice(i, 1);
          continue;
        }
        const fade = age < HOLD ? 1 : 1 - (age - HOLD) / FADE;
        context.globalAlpha = 0.42 * fade * fade;
        context.setTransform(SCALE * ratio, 0, 0, SCALE * ratio, print.x * ratio, print.y * ratio);
        context.rotate(print.angle);
        context.translate(-32, -34);
        context.fillStyle = '#c2622b';
        context.fill(paw);
      }
      if (prints.length) frame = requestAnimationFrame(draw);
      else drawing = false;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (Number.isNaN(lastX)) {
        lastX = event.clientX;
        lastY = event.clientY;
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      travelled += Math.hypot(dx, dy);
      if (travelled >= STEP) {
        travelled = 0;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        side = -side;
        prints.push({
          x: event.clientX + Math.cos(angle) * SIDE * side + 14,
          y: event.clientY + Math.sin(angle) * SIDE * side + 16,
          angle,
          born: performance.now(),
        });
        if (prints.length > MAX_PRINTS) prints.shift();
        if (!drawing) {
          drawing = true;
          frame = requestAnimationFrame(draw);
        }
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('resize', resize);
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
      clear();
    };
  }, [reduced]);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[70] size-full" />;
}
