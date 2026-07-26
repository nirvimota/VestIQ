import React, { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// vestIQ — shared ambient background
// A faint field of continuously-moving stock lines, reused across Dashboard,
// Portfolio, Alerts and KYC so every interior page feels alive instead of
// static. Deliberately subtle (low opacity + radial mask) so it never
// competes with real data. Pure SVG + rAF — no extra deps.
// ---------------------------------------------------------------------------

const LINES = [
  { seed: 11, color: '#2ED9B8', y: 90, amp: 26, freq: 1.6, speed: 0.12 },
  { seed: 29, color: '#e8b84b', y: 230, amp: 18, freq: 1.1, speed: 0.09 },
  { seed: 47, color: '#2ED9B8', y: 360, amp: 22, freq: 1.4, speed: 0.15 },
  { seed: 63, color: '#5B9CFF', y: 500, amp: 16, freq: 1.9, speed: 0.1 },
];

function makeRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function AmbientBackground({ opacity = 0.14 }) {
  const pathRefs = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = 1400;
    const POINTS = 48;
    const configs = LINES.map((line) => {
      const rand = makeRand(line.seed);
      return {
        ...line,
        phase: rand() * Math.PI * 2,
        amp2: line.amp * 0.4,
        freq2: line.freq * 2.3,
        speed2: line.speed * 1.6,
      };
    });

    let start = performance.now();

    const draw = (now) => {
      const t = (now - start) / 1000;
      configs.forEach((cfg, i) => {
        const el = pathRefs.current[i];
        if (!el) return;
        const raw = new Array(POINTS);
        for (let p = 0; p < POINTS; p++) {
          const u = p / (POINTS - 1);
          raw[p] =
            cfg.y +
            cfg.amp * Math.sin(u * cfg.freq * Math.PI * 2 + t * cfg.speed + cfg.phase) +
            cfg.amp2 * Math.sin(u * cfg.freq2 * Math.PI * 2 - t * cfg.speed2 + cfg.phase * 1.7);
        }
        let d = '';
        for (let p = 0; p < POINTS; p++) {
          const prev = raw[Math.max(0, p - 1)];
          const next = raw[Math.min(POINTS - 1, p + 1)];
          const y = (prev + raw[p] * 2 + next) / 4;
          const x = (p / (POINTS - 1)) * W;
          d += `${p === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
        }
        el.setAttribute('d', d);
      });
      if (!reducedMotion) rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 88%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 35%, black 35%, transparent 88%)',
      }}
    >
      <svg viewBox="0 0 1400 600" preserveAspectRatio="none" className="w-full h-full">
        {LINES.map((line, i) => (
          <path
            key={line.seed}
            ref={(el) => (pathRefs.current[i] = el)}
            fill="none"
            stroke={line.color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        ))}
      </svg>
    </div>
  );
}