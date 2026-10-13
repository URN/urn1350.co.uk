import React, { useEffect, useRef } from 'react';
import DJ_FIGURE from './djFigure';

const GRID = 112;
const DOT = 0.64;
const BASE = [150, 120, 222];
// Rising sound pixels are white or the poster's green.
const SPARKS = [
  [255, 255, 255],
  [150, 232, 92],
];
// Matches --sunken, the hero background, so dimmed and rising dots sink into it.
const GROUND = [20, 19, 20];
// Columns of the EQ across the figure, bass on the left through to treble on the right.
const BANDS = 18;
const MAX_SPARKS = 1100;
const LOW_HZ = 30;
const HIGH_HZ = 14000;
// How far, in dots, a column's pixels rise when its band is at full level.
const MAX_RISE = 46;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function buildFigure() {
  const rows = DJ_FIGURE.length;
  const cols = DJ_FIGURE[0].length;
  const offsetX = Math.floor((GRID - cols) / 2);
  const offsetY = GRID - rows - 2;
  const level = (x, y) => {
    const ch = DJ_FIGURE[y] && DJ_FIGURE[y][x];
    return ch && ch !== '.' ? Number(ch) : 0;
  };
  const lit = (x, y) => level(x, y) >= 2;
  const cells = [];
  const edges = Array.from({ length: BANDS }, () => []);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!lit(x, y)) continue;
      const cell = {
        x: x + offsetX,
        y: y + offsetY,
        shade: 0.12 + (level(x, y) / 9) ** 1.4 * 1.05,
        band: Math.min(BANDS - 1, Math.floor((x / cols) * BANDS)),
        tint: rand(0.9, 1.06),
      };
      cells.push(cell);
    }
  }

  // Sound pixels launch from inside the figure, so they rise across it rather than behind it.
  cells.forEach((c) => {
    if (c.shade > 0.3) edges[c.band].push(c);
  });

  return { cells, edges };
}

/**
 * The purple DJ from the URN Rewired poster as a dot matrix, with dots lifting off it and rising into the background.
 * While the stream plays, the figure shimmers and sheds dots in time with the live audio.
 */
export default function PixelDJ({ playing = false, analyserRef = null }) {
  const canvasRef = useRef(null);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { cells, edges } = buildFigure();
    const sparks = [];
    const peaks = new Float32Array(BANDS).fill(0.2);
    const glow = new Float32Array(BANDS);
    let data = null;
    let frame = 0;
    let size = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (band, level, quiet) => {
      if (sparks.length >= MAX_SPARKS || !edges[band].length) return;
      const from = pick(edges[band]);
      // Louder bands throw their pixels higher, so each column reads like an EQ bar.
      const rise = quiet ? rand(4, 9) : 3 + level * MAX_RISE * rand(0.75, 1);
      sparks.push({
        x: from.x,
        y0: from.y - 1,
        y: from.y - 1,
        rise,
        age: 0,
        life: quiet ? rand(2, 3.2) : 0.5 + level * 0.9 + rand(0, 0.2),
        bright: quiet ? rand(0.4, 0.7) : 0.6 + level * 0.4,
        color: pick(SPARKS),
      });
    };

    const readAudio = (analyser) => {
      if (!data || data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const levels = new Float32Array(BANDS);
      const binHz = analyser.context.sampleRate / analyser.fftSize;
      for (let b = 0; b < BANDS; b += 1) {
        // Log-spaced edges: every band spans the same musical interval, so the bass gets as many columns as the treble.
        const lo = LOW_HZ * (HIGH_HZ / LOW_HZ) ** (b / BANDS);
        const hi = LOW_HZ * (HIGH_HZ / LOW_HZ) ** ((b + 1) / BANDS);
        const from = Math.max(1, Math.floor(lo / binHz));
        const to = Math.min(data.length, Math.max(from + 1, Math.ceil(hi / binHz)));
        let sum = 0;
        for (let i = from; i < to; i += 1) sum += data[i];
        const raw = sum / ((to - from) * 255);
        // Each band is scaled to its own recent peak, so quieter frequencies still move.
        peaks[b] = Math.max(raw, peaks[b] * 0.996, 0.12);
        levels[b] = Math.min(1, Math.max(0, (raw / peaks[b] - 0.35) / 0.65));
      }
      return levels;
    };

    // Stand-in EQ for browsers that cannot analyse the stream (Safari): a steady kick in the bass
    // columns and a slowly wandering spread across the rest, so playback still looks alive.
    const sim = new Float32Array(BANDS).fill(0.4);
    const simulateLevels = (now) => {
      const levels = new Float32Array(BANDS);
      const beat = ((now / 1000) * (124 / 60)) % 1;
      const kick = Math.exp(-beat * 6);
      for (let b = 0; b < BANDS; b += 1) {
        sim[b] = Math.min(0.85, Math.max(0.1, sim[b] + (Math.random() - 0.5) * 0.08));
        const bass = Math.max(0, 1 - b / 5);
        levels[b] = Math.min(1, sim[b] * (0.55 + 0.45 * (1 - bass)) + kick * bass * 0.7);
      }
      return levels;
    };

    const draw = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const analyser = playingRef.current && analyserRef ? analyserRef.current : null;

      if (!still) {
        if (analyser || playingRef.current) {
          const levels = analyser ? readAudio(analyser) : simulateLevels(now);
          for (let b = 0; b < BANDS; b += 1) {
            glow[b] += (levels[b] - glow[b]) * (levels[b] > glow[b] ? 0.5 : 0.15);
            const count = levels[b] ** 1.8 * 2.2;
            for (let n = Math.floor(count) + (Math.random() < count % 1 ? 1 : 0); n > 0; n -= 1) spawn(b, levels[b], false);
          }
        } else {
          for (let b = 0; b < BANDS; b += 1) glow[b] *= 0.92;
          if (Math.random() < 0.07) spawn(Math.floor(Math.random() * BANDS), 0, true);
        }
      }

      ctx.clearRect(0, 0, size, size);
      const pitch = size / GRID;
      const dot = Math.max(1, Math.round(pitch * DOT));
      const inset = (pitch - dot) / 2;

      for (let i = 0; i < cells.length; i += 1) {
        const c = cells[i];
        const k = Math.min(1.15, c.shade * c.tint * (0.82 + glow[c.band] * 0.3));
        const r = Math.round(GROUND[0] + (BASE[0] - GROUND[0]) * k);
        const g = Math.round(GROUND[1] + (BASE[1] - GROUND[1]) * k);
        const b = Math.round(GROUND[2] + (BASE[2] - GROUND[2]) * k);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(Math.round(c.x * pitch + inset), Math.round(c.y * pitch + inset), dot, dot);
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.age += dt;
        const p = s.age / s.life;
        s.y = s.y0 - s.rise * (1 - (1 - Math.min(1, p)) ** 2);
        if (p >= 1 || s.y < -1) {
          sparks.splice(i, 1);
          continue;
        }
        const gx = s.x;
        const gy = Math.round(s.y);
        // Fade towards the background as the dot rises, so it dissolves rather than vanishing.
        const fade = Math.min(1, p ** 1.6 + Math.max(0, (8 - gy) / 8) * 0.6);
        // Fade out to transparent so a dot passing over the figure never darkens it.
        ctx.fillStyle = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${(s.bright * (1 - fade)).toFixed(3)})`;
        ctx.fillRect(Math.round(gx * pitch + inset), Math.round(gy * pitch + inset), dot, dot);
      }

      if (!still) frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);

    const observer = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [analyserRef]);

  return <canvas ref={canvasRef} className="live__radio" aria-hidden="true" />;
}
