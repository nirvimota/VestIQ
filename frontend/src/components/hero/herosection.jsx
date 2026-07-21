import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// vestIQ — Hero Section
// Signature element: "Signal Lattice" — thousands of particles representing
// raw market noise (every tick, every stock, every rumor) that converge, as
// the user scrolls, into a single clean rising line: the "IQ" of the product.
// ---------------------------------------------------------------------------

const TICKERS = [
  ['RELIANCE', '2,945.60', '+1.2%', true],
  ['TCS', '3,812.40', '-0.4%', false],
  ['HDFCBANK', '1,675.20', '+0.8%', true],
  ['INFY', '1,842.90', '+0.3%', true],
  ['NIFTY 50', '24,812.35', '+0.62%', true],
  ['SENSEX', '81,245.10', '+0.58%', true],
  ['BANKNIFTY', '52,340.15', '-0.21%', false],
  ['ICICIBANK', '1,298.75', '+0.9%', true],
];

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export default function HeroSection() {
  const wrapperRef = useRef(null);
  const mountRef = useRef(null);
  const stateRef = useRef({ progress: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    const wrapper = wrapperRef.current;
    if (!mount || !wrapper) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const isMobile = width < 640;
    const COUNT = isMobile ? 1100 : 2400;

    const startPos = new Float32Array(COUNT * 3);
    const endPos = new Float32Array(COUNT * 3);
    const curPos = new Float32Array(COUNT * 3);
    const startColor = new Float32Array(COUNT * 3);
    const endColor = new Float32Array(COUNT * 3);
    const curColor = new Float32Array(COUNT * 3);
    const delay = new Float32Array(COUNT);

    const SLATE = new THREE.Color('#5b6472');
    const GOLD = new THREE.Color('#e8b84b');
    const TEAL = new THREE.Color('#3fd6c0');

    for (let i = 0; i < COUNT; i++) {
      // --- scattered "noise" starting position ---
      const r = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      startPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      startPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      startPos[i * 3 + 2] = r * Math.cos(phi) * 0.6;

      // --- converged "signal" position: a rising, slightly jagged line ---
      const t = i / COUNT;
      const x = (t - 0.5) * 16;
      const jag = Math.sin(t * 26) * 0.18 + Math.sin(t * 7 + 1.3) * 0.35;
      const y = -2.6 + t * 5.6 + jag;
      const z = (Math.random() - 0.5) * 0.5;
      endPos[i * 3 + 0] = x;
      endPos[i * 3 + 1] = y;
      endPos[i * 3 + 2] = z;

      // colors
      SLATE.toArray(startColor, i * 3);
      const c = t < 0.55 ? TEAL : GOLD;
      c.toArray(endColor, i * 3);

      // stagger: left of the curve resolves first
      delay[i] = t * 0.55;

      curPos[i * 3] = startPos[i * 3];
      curPos[i * 3 + 1] = startPos[i * 3 + 1];
      curPos[i * 3 + 2] = startPos[i * 3 + 2];
      curColor[i * 3] = startColor[i * 3];
      curColor[i * 3 + 1] = startColor[i * 3 + 1];
      curColor[i * 3 + 2] = startColor[i * 3 + 2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(curPos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(curColor, 3));

    const material = new THREE.PointsMaterial({
      size: isMobile ? 0.055 : 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let raf = null;

    const render = () => {
      const progress = stateRef.current.progress;
      const posAttr = geometry.getAttribute('position');
      const colAttr = geometry.getAttribute('color');

      for (let i = 0; i < COUNT; i++) {
        const local = smoothstep(delay[i], delay[i] + 0.42, progress);
        const ix = i * 3;
        posAttr.array[ix] = startPos[ix] + (endPos[ix] - startPos[ix]) * local;
        posAttr.array[ix + 1] =
          startPos[ix + 1] + (endPos[ix + 1] - startPos[ix + 1]) * local;
        posAttr.array[ix + 2] =
          startPos[ix + 2] + (endPos[ix + 2] - startPos[ix + 2]) * local;

        colAttr.array[ix] = startColor[ix] + (endColor[ix] - startColor[ix]) * local;
        colAttr.array[ix + 1] =
          startColor[ix + 1] + (endColor[ix + 1] - startColor[ix + 1]) * local;
        colAttr.array[ix + 2] =
          startColor[ix + 2] + (endColor[ix + 2] - startColor[ix + 2]) * local;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      points.rotation.y = 0.12 * Math.sin(progress * Math.PI * 0.6);
      camera.position.x = Math.sin(progress * Math.PI) * 1.1;
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
      if (!reducedMotion) raf = requestAnimationFrame(render);
    };

    const onScroll = () => {
      const rect = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      stateRef.current.progress = p;
      setProgress(p);
      if (reducedMotion) render();
    };

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    render();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // opacity phases derived from scroll progress
  const opA = 1 - smoothstep(0, 0.22, progress); // noise kicker
  const opB = smoothstep(0.18, 0.4, progress) * (1 - smoothstep(0.92, 1, progress)); // lockup
  const opC = smoothstep(0.62, 0.85, progress); // CTA + readout + ticker

  return (
    <div className="bg-[#0a0d12]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .viq-display { font-family: 'Space Grotesk', sans-serif; }
        .viq-mono { font-family: 'IBM Plex Mono', monospace; }
        .viq-body { font-family: 'Inter', sans-serif; }
        @keyframes viq-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .viq-marquee-track {
          animation: viq-marquee 32s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .viq-marquee-track { animation: none; }
        }
      `}</style>

      {/* top nav */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 md:px-10 py-5">
        <span className="viq-display text-[#ECEEF0] text-xl tracking-tight">
          vest<span className="text-[#e8b84b]">IQ</span>
        </span>
        <nav className="flex items-center gap-3 md:gap-5">
          <button className="viq-body hidden sm:inline text-sm text-[#8B96A5] hover:text-[#ECEEF0] transition-colors">
            Log in
          </button>
          <button className="viq-body text-sm px-4 py-2 rounded-full bg-[#e8b84b] text-[#0a0d12] font-medium hover:bg-[#f0c665] transition-colors">
            Get started
          </button>
        </nav>
      </header>

      {/* scroll-pinned hero */}
      <div ref={wrapperRef} style={{ height: '300vh' }} className="relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* 3D canvas layer */}
          <div ref={mountRef} className="absolute inset-0 pointer-events-none" />

          {/* gradient vignette for legibility */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,#0a0d12_88%)]" />

          {/* phase A — noise kicker */}
          <div
            className="absolute inset-x-0 top-[30%] flex flex-col items-center text-center px-6"
            style={{ opacity: opA }}
          >
            <span className="viq-mono text-xs tracking-[0.2em] text-[#6B7686] uppercase">
              NSE · BSE · 5,000+ stocks, every tick
            </span>
            <p className="viq-body text-[#8B96A5] mt-3 max-w-md text-sm md:text-base">
              The market never stops talking. Most of it doesn't matter.
            </p>
          </div>

          {/* phase B — lockup */}
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6"
            style={{ opacity: opB }}
          >
            <h1 className="viq-display text-5xl md:text-7xl font-bold tracking-tight text-[#ECEEF0]">
              vest<span className="text-[#e8b84b]">IQ</span>
            </h1>
            <p className="viq-body text-[#C4CBD4] mt-4 text-base md:text-lg max-w-lg">
              One signal, not the noise. Real-time NIFTY &amp; SENSEX tracking,
              smart alerts, and order execution built for how Indian markets
              actually move.
            </p>
          </div>

          {/* phase C — readout + CTA */}
          <div
            className="absolute inset-x-0 bottom-[16%] flex flex-col items-center gap-6 px-6"
            style={{ opacity: opC }}
          >
            <div className="viq-mono flex flex-wrap justify-center gap-4 text-xs md:text-sm">
              <span className="text-[#ECEEF0]">
                NIFTY 50 <span className="text-[#3fd6c0]">24,812.35 ▲0.62%</span>
              </span>
              <span className="text-[#ECEEF0]">
                SENSEX <span className="text-[#3fd6c0]">81,245.10 ▲0.58%</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="viq-body text-sm px-5 py-2.5 rounded-full bg-[#e8b84b] text-[#0a0d12] font-medium hover:bg-[#f0c665] transition-colors">
                Start investing
              </button>
              <button className="viq-body text-sm px-5 py-2.5 rounded-full border border-[#2A3138] text-[#ECEEF0] hover:border-[#3fd6c0] transition-colors">
                Explore live markets
              </button>
            </div>
          </div>

          {/* ticker tape */}
          <div
            className="absolute bottom-0 inset-x-0 border-t border-[#161B22] bg-[#0a0d12]/80 backdrop-blur-sm overflow-hidden py-2.5"
            style={{ opacity: opC }}
          >
            <div className="flex whitespace-nowrap viq-marquee-track viq-mono text-xs">
              {[...TICKERS, ...TICKERS].map(([sym, price, chg, up], i) => (
                <span key={i} className="mx-4 text-[#8B96A5]">
                  <span className="text-[#ECEEF0]">{sym}</span>{' '}
                  <span>{price}</span>{' '}
                  <span className={up ? 'text-[#3fd6c0]' : 'text-[#E5484D]'}>
                    {chg}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}