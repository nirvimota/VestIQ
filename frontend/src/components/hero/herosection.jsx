import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// ---------------------------------------------------------------------------
// vestIQ — Hero Section v2
// Four scroll-driven acts, one continuous 3D scene:
//   1. NOISE     — thousands of scattered points (every tick, every rumor)
//   2. SIGNAL    — points converge into a single rising line
//   3. STRUCTURE — the line crossfades into a live candlestick chart while
//                  the camera arcs around it; glass stat-cards dock in
//   4. RESOLVE   — chart settles, vestIQ lockup + CTA + ticker tape
// Built on plain `three` (no extra 3D deps) + CSS transitions for the DOM
// layer, so it drops straight into the existing Vite project.
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

const STAT_CARDS = [
  { label: 'NIFTY 50', value: '24,812.35', change: '+0.62%', up: true, edge: 'left' },
  { label: 'SENSEX', value: '81,245.10', change: '+0.58%', up: true, edge: 'right' },
  { label: 'RELIANCE', value: '2,945.60', change: '+1.24%', up: true, edge: 'bottom' },
];

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function HeroSection() {
  const wrapperRef = useRef(null);
  const mountRef = useRef(null);
  const stateRef = useRef({ progress: 0, mouseX: 0, mouseY: 0, smMouseX: 0, smMouseY: 0 });
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
    const isMobile = width < 640;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 13);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const rig = new THREE.Group();
    scene.add(rig);

    // ------------------------------------------------------------------
    // Particle field: NOISE -> SIGNAL (rising line)
    // ------------------------------------------------------------------
    const COUNT = isMobile ? 1000 : 2200;
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
    const CORAL = new THREE.Color('#e5484d');

    const LINE_X_MIN = -8;
    const LINE_X_MAX = 8;
    const BASELINE_Y = -3.0;

    function curveY(t) {
      const jag = Math.sin(t * 26) * 0.18 + Math.sin(t * 7 + 1.3) * 0.35;
      return BASELINE_Y + 0.4 + t * 5.6 + jag;
    }

    for (let i = 0; i < COUNT; i++) {
      const r = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      startPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      startPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      startPos[i * 3 + 2] = r * Math.cos(phi) * 0.6;

      const t = i / COUNT;
      const x = LINE_X_MIN + t * (LINE_X_MAX - LINE_X_MIN);
      const y = curveY(t);
      const z = (Math.random() - 0.5) * 0.5;
      endPos[i * 3 + 0] = x;
      endPos[i * 3 + 1] = y;
      endPos[i * 3 + 2] = z;

      SLATE.toArray(startColor, i * 3);
      const c = t < 0.55 ? TEAL : GOLD;
      c.toArray(endColor, i * 3);

      delay[i] = t * 0.5;

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

    // crisp core points
    const coreMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.05 : 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const corePoints = new THREE.Points(geometry, coreMaterial);

    // soft halo behind — cheap stand-in for bloom, additive blending
    const haloMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.16 : 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloPoints = new THREE.Points(geometry, haloMaterial);

    rig.add(haloPoints);
    rig.add(corePoints);

    // ------------------------------------------------------------------
    // Candlestick chart: STRUCTURE
    // ------------------------------------------------------------------
    const CANDLE_COUNT = 14;
    const candleGroup = new THREE.Group();
    const candles = [];

    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let cursor = 60;
    for (let i = 0; i < CANDLE_COUNT; i++) {
      const t = i / (CANDLE_COUNT - 1);
      const x = LINE_X_MIN + t * (LINE_X_MAX - LINE_X_MIN);

      const open = cursor;
      const up = rand() > 0.35;
      const delta = 2 + rand() * 5;
      const close = up ? open + delta : open - delta * 0.6;
      cursor = close;

      const bodyLow = Math.min(open, close);
      const bodyHigh = Math.max(open, close);
      const wickHigh = bodyHigh + rand() * 2;
      const wickLow = bodyLow - rand() * 1.5;

      const scaleFactor = 5.6 / 90; // matches curve's overall vertical rise
      const bodyBottomY = BASELINE_Y + 0.4 + bodyLow * scaleFactor;
      const bodyHeight = Math.max((bodyHigh - bodyLow) * scaleFactor, 0.12);
      const wickBottomY = BASELINE_Y + 0.4 + wickLow * scaleFactor;
      const wickHeight = (wickHigh - wickLow) * scaleFactor;

      const color = up ? TEAL : CORAL;

      const bodyGeo = new THREE.BoxGeometry(0.42, 1, 0.32);
      bodyGeo.translate(0, 0.5, 0); // pivot at bottom so it grows upward
      const bodyMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(x, bodyBottomY, 0);
      body.scale.y = 0.001;
      body.userData = { targetHeight: bodyHeight, delay: t * 0.5 };

      const wickGeo = new THREE.BoxGeometry(0.05, 1, 0.05);
      wickGeo.translate(0, 0.5, 0);
      const wickMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
      });
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(x, wickBottomY, -0.02);
      wick.scale.y = 0.001;
      wick.userData = { targetHeight: wickHeight, delay: t * 0.5 };

      candleGroup.add(body);
      candleGroup.add(wick);
      candles.push(body, wick);
    }
    rig.add(candleGroup);

    // ------------------------------------------------------------------
    // Render / animation loop
    // ------------------------------------------------------------------
    let raf = null;

    const render = () => {
      const progress = stateRef.current.progress;

      // smoothed mouse parallax
      stateRef.current.smMouseX = lerp(stateRef.current.smMouseX, stateRef.current.mouseX, 0.06);
      stateRef.current.smMouseY = lerp(stateRef.current.smMouseY, stateRef.current.mouseY, 0.06);

      // --- particle noise -> signal ---
      const posAttr = geometry.getAttribute('position');
      const colAttr = geometry.getAttribute('color');
      for (let i = 0; i < COUNT; i++) {
        const local = smoothstep(delay[i], delay[i] + 0.4, progress);
        const ix = i * 3;
        posAttr.array[ix] = startPos[ix] + (endPos[ix] - startPos[ix]) * local;
        posAttr.array[ix + 1] = startPos[ix + 1] + (endPos[ix + 1] - startPos[ix + 1]) * local;
        posAttr.array[ix + 2] = startPos[ix + 2] + (endPos[ix + 2] - startPos[ix + 2]) * local;

        colAttr.array[ix] = startColor[ix] + (endColor[ix] - startColor[ix]) * local;
        colAttr.array[ix + 1] = startColor[ix + 1] + (endColor[ix + 1] - startColor[ix + 1]) * local;
        colAttr.array[ix + 2] = startColor[ix + 2] + (endColor[ix + 2] - startColor[ix + 2]) * local;
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // crossfade particles out / candles in over 0.42 - 0.66
      const particleFade = 1 - smoothstep(0.42, 0.66, progress);
      coreMaterial.opacity = 0.95 * particleFade;
      haloMaterial.opacity = 0.22 * particleFade;

      const candleFade = smoothstep(0.46, 0.66, progress);
      for (const mesh of candles) {
        const grow = smoothstep(mesh.userData.delay + 0.46, mesh.userData.delay + 0.7, progress);
        mesh.scale.y = Math.max(0.001, grow * mesh.userData.targetHeight);
        mesh.material.opacity = candleFade;
      }

      // --- camera choreography ---
      const swayT = smoothstep(0, 0.5, progress);
      const orbitT = smoothstep(0.55, 0.85, progress);
      const settleT = smoothstep(0.85, 1, progress);

      const baseZ = lerp(13, 9, swayT) - orbitT * 1.3 - settleT * 0.4;
      const baseX = Math.sin(progress * Math.PI) * 1.1 * (1 - orbitT * 0.4) + Math.sin(orbitT * Math.PI) * 2.1;
      const baseY = 0.4 + orbitT * 0.35;

      camera.position.x = baseX + stateRef.current.smMouseX * 0.4;
      camera.position.y = baseY + stateRef.current.smMouseY * 0.2;
      camera.position.z = baseZ;
      camera.lookAt(0, 0.2 + orbitT * 0.2, 0);

      candleGroup.rotation.y = orbitT * 0.18;
      rig.rotation.y = stateRef.current.smMouseX * 0.05;
      rig.rotation.x = stateRef.current.smMouseY * -0.03;

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

    const onPointerMove = (e) => {
      stateRef.current.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      stateRef.current.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
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
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    onScroll();
    render();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      if (raf) cancelAnimationFrame(raf);
      geometry.dispose();
      coreMaterial.dispose();
      haloMaterial.dispose();
      candles.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ---- DOM layer opacity/transform phases derived from scroll progress ----
  const opKicker = 1 - smoothstep(0, 0.18, progress);
  const opMid = smoothstep(0.18, 0.36, progress) * (1 - smoothstep(0.5, 0.6, progress));
  const opCards = smoothstep(0.56, 0.78, progress) * (1 - smoothstep(0.93, 1, progress));
  const opLockup = smoothstep(0.82, 0.98, progress);

  const cardTransform = (edge) => {
    const t = opCards;
    if (edge === 'left') return `translateX(${lerp(-40, 0, t)}px)`;
    if (edge === 'right') return `translateX(${lerp(40, 0, t)}px)`;
    return `translateY(${lerp(30, 0, t)}px)`;
  };

  return (
    <div className="bg-[#0a0d12]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .viq-display { font-family: 'Space Grotesk', sans-serif; }
        .viq-mono { font-family: 'IBM Plex Mono', monospace; }
        .viq-body { font-family: 'Inter', sans-serif; }
        @keyframes viq-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .viq-marquee-track { animation: viq-marquee 32s linear infinite; }
        @keyframes viq-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        .viq-glow-blob { animation: viq-glow-pulse 4.5s ease-in-out infinite; }
        .viq-letter {
          display: inline-block;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .viq-glass {
          background: rgba(19, 24, 32, 0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .viq-marquee-track, .viq-glow-blob { animation: none; }
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

      {/* scroll-pinned hero, 420vh across 4 acts */}
      <div ref={wrapperRef} style={{ height: '420vh' }} className="relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <div ref={mountRef} className="absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,#0a0d12_88%)]" />

          {/* act 1 — noise kicker */}
          <div className="absolute inset-x-0 top-[30%] flex flex-col items-center text-center px-6" style={{ opacity: opKicker }}>
            <span className="viq-mono text-xl tracking-[0.2em] text-[#6B7686] uppercase">
              AI MARKET INTELLIGENCE
            </span>
            <p className="viq-body text-[#ffffff] mt-3 max-w-6xl bold text-5xl md:text-6xl">
              Your Personal Trading Intelligence.
            </p>
            <p className="viq-body text-[#B0B0B0] mt-2 max-w-3xl text-2xl md:text-3xl">
              One platform to analyze markets, manage investments, discover opportunities, and stay ahead with AI-powered decision support.
            </p>
          </div>

          {/* act 2 — mid reveal, letter stagger */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6" style={{ opacity: opMid }}>
            <h2 className="viq-display text-3xl md:text-5xl text-[#ECEEF0]">
              {'Market Noise Ends Here.'.split('').map((ch, i) => (
                <span
                  key={i}
                  className="viq-letter"
                  style={{
                    opacity: opMid > 0.05 ? 1 : 0,
                    transform: opMid > 0.05 ? 'translateY(0)' : 'translateY(10px)',
                    transitionDelay: `${i * 14}ms`,
                  }}
                >
                  {ch === ' ' ? '\u00A0' : ch}
                </span>
              ))}
            </h2>
            <p className="viq-body text-[#8B96A5] mt-4 max-w-md text-sm md:text-base">
              Harness AI to analyze charts, decode market sentiment, identify high-probability setups, and make confident trading decisions in real time.
            </p>
          </div>

          {/* act 3 — floating glass stat cards */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: opCards }}>
            <div className="absolute inset-x-0 top-[8%] flex flex-col items-center text-center px-6">
              <span className="viq-mono text-xs tracking-[0.2em] text-[#6B7686] uppercase">
                From noise to numbers
              </span>
              <p className="viq-body text-[#8B96A5] mt-2 max-w-sm text-sm">
                This is the same market, structured: live indices, your
                watchlist, and the stock you're tracking — updating in real time,
                not on a 15-minute delay.
              </p>
            </div>
            <div
              className="viq-glass absolute left-6 md:left-14 top-[28%] rounded-2xl px-4 py-3 w-40"
              style={{ transform: cardTransform('left') }}
            >
              <p className="viq-mono text-[10px] text-[#6B7686] uppercase">{STAT_CARDS[0].label}</p>
              <p className="viq-mono text-sm text-[#ECEEF0] mt-1">{STAT_CARDS[0].value}</p>
              <p className="viq-mono text-xs text-[#3fd6c0] flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} /> {STAT_CARDS[0].change}
              </p>
            </div>
            <div
              className="viq-glass absolute right-6 md:right-14 top-[22%] rounded-2xl px-4 py-3 w-40"
              style={{ transform: cardTransform('right') }}
            >
              <p className="viq-mono text-[10px] text-[#6B7686] uppercase">{STAT_CARDS[1].label}</p>
              <p className="viq-mono text-sm text-[#ECEEF0] mt-1">{STAT_CARDS[1].value}</p>
              <p className="viq-mono text-xs text-[#3fd6c0] flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} /> {STAT_CARDS[1].change}
              </p>
            </div>
            <div
              className="viq-glass absolute left-1/2 -translate-x-1/2 bottom-[30%] rounded-2xl px-4 py-3 w-44"
              style={{ transform: `translateX(-50%) ${cardTransform('bottom')}` }}
            >
              <p className="viq-mono text-[10px] text-[#6B7686] uppercase flex items-center gap-1">
                <Activity size={11} /> {STAT_CARDS[2].label}
              </p>
              <p className="viq-mono text-sm text-[#ECEEF0] mt-1">{STAT_CARDS[2].value}</p>
              <p className="viq-mono text-xs text-[#3fd6c0] flex items-center gap-1 mt-0.5">
                <TrendingUp size={12} /> {STAT_CARDS[2].change}
              </p>
            </div>
          </div>

          {/* act 4 — resolve: lockup + CTA + ticker */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center text-center px-6" style={{ opacity: opLockup }}>
            <div className="relative">
              <div
                className="viq-glow-blob absolute inset-0 blur-3xl rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(232,184,75,0.35), transparent 70%)' }}
              />
              <h1 className="relative viq-display text-5xl md:text-7xl font-bold tracking-tight text-[#ECEEF0]">
                Vest<span className="text-[#e8b84b]">IQ</span>
              </h1>
            </div>
            <p className="viq-body text-[#C4CBD4] mt-4 text-base md:text-lg max-w-lg">
              One signal, not the noise. Real-time NIFTY &amp; SENSEX tracking,
              smart alerts, and order execution built for how Indian markets actually move.
            </p>
            <p className="viq-body text-[#8B96A5] mt-3 max-w-md text-sm">
              No 15-minute delays, no buried order forms, no guessing whether
              your margin covers a trade. vestIQ shows you what changed, why it
              matters, and lets you act on it in one tap.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {['Real-time data', 'Smart alerts', 'One-tap execution'].map((f) => (
                <span
                  key={f}
                  className="viq-mono text-[11px] text-[#8B96A5] border border-[#2A3138] rounded-full px-3 py-1"
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-7">
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
            style={{ opacity: opLockup }}
          >
            <div className="flex whitespace-nowrap viq-marquee-track viq-mono text-xs">
              {[...TICKERS, ...TICKERS].map(([sym, price, chg, up], i) => (
                <span key={i} className="mx-4 text-[#8B96A5]">
                  <span className="text-[#ECEEF0]">{sym}</span> <span>{price}</span>{' '}
                  <span className={up ? 'text-[#3fd6c0]' : 'text-[#E5484D]'}>{chg}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}