// Peen Landing Page — shared icons, tokens, primitives
// Loaded into window globals.

const PEEN = {
  tint: '#D55A1F',
  nav: '#2860A3',
  exp: '#459B51',
  charcoal: '#1F1F20',
  paper: '#FCFBFE',
  surface: '#FAF7F4',
  fieldFill: '#F7F4F0',
  fg1: '#1F1F20',
  fg2: 'rgba(60,60,67,0.66)',
  fg3: 'rgba(60,60,67,0.36)',
  sep: 'rgba(31,31,32,0.08)',
  flash: '#FFD700',
  purple: '#9B59B6',
  // earthy rock gradient stops
  rockA: '#c2bab0',
  rockB: '#9b938a',
  rockC: '#7b746d',
  rockD: '#4c4641',
};

const PFONT = '"Google Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// ----- Inline icon set (climbing-flavored, lucide-ish) -----
function PIcon({ name, size = 22, color = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'mountain':       return <svg {...p}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>;
    case 'mountain-snow':  return <svg {...p}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="m9 7 1.5 3L12 7"/><path d="m15 8 1 2 1-2"/></svg>;
    case 'climber':        return <svg {...p}><circle cx="12" cy="5" r="2"/><path d="M5 22l4-9 5 4 4-3"/></svg>;
    case 'leaf':           return <svg {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c.38 4.84-.12 9.5-3.06 12.42A6.97 6.97 0 0 1 11 20z"/><path d="M2 22l8-8"/></svg>;
    case 'search':         return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'flash':          return <svg {...{...p, fill: color, stroke: 'none'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'eye':            return <svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'check-circle':   return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'repeat':         return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>;
    case 'arrow-up-circle':return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16V8m-4 4l4-4 4 4"/></svg>;
    case 'people':         return <svg {...p}><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2.5"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>;
    case 'home':           return <svg {...p}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>;
    case 'chart':          return <svg {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>;
    case 'map':            return <svg {...p}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><path d="M9 3v15M15 6v15"/></svg>;
    case 'pin':            return <svg {...p}><path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'compass':        return <svg {...p}><circle cx="12" cy="12" r="9"/><polygon points="16 8 12.5 12.5 8 16 11.5 11.5"/></svg>;
    case 'shoe':           return <svg {...p}><path d="M3 18h18l-1-3-3-1-2-2-2-1-2 1-2-1H4z"/><path d="M3 18v2M21 18v2"/></svg>;
    case 'bolt':           return <svg {...{...p, fill: color, stroke: 'none'}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'star':           return <svg {...{...p, fill: color, stroke: 'none'}}><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>;
    case 'apple':          return <svg {...{...p, fill: color, stroke: 'none'}}><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>;
    case 'arrow-right':    return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'play':           return <svg {...{...p, fill: color, stroke: 'none'}}><polygon points="6 4 20 12 6 20"/></svg>;
    case 'qr':             return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 21h7M17 17v4"/></svg>;
    case 'carabiner':      return <svg {...p}><path d="M12 3a6 6 0 0 1 6 6v9a3 3 0 0 1-6 0V9a6 6 0 1 0-6 6"/><path d="M9 12h3"/></svg>;
    case 'arrow-down':     return <svg {...p}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    default: return null;
  }
}

// ----- Reveal-on-scroll wrapper -----
function Reveal({ children, delay = 0, y = 24, as: Tag = 'div', style = {}, ...rest }) {
  const ref = React.useRef(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} style={{
      transition: 'opacity .9s cubic-bezier(.22,.61,.36,1), transform .9s cubic-bezier(.22,.61,.36,1)',
      transitionDelay: `${delay}ms`,
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
      ...style,
    }} {...rest}>{children}</Tag>
  );
}

// ----- Rock blob (signature brand element) -----
function RockBlob({ x, y, w = 220, h = 160, rot = 0, opacity = 0.95, phase = 0, intensity = 1 }) {
  return (
    <div className="peen-rock" style={{
      position: 'absolute',
      left: x, top: y,
      width: w, height: h,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
      opacity,
      animation: `peenBob ${3.4 / Math.max(0.4, intensity)}s ease-in-out ${phase}s infinite alternate`,
      filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.20))',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: '46% 54% 60% 40% / 50% 44% 56% 50%',
        background: `radial-gradient(120% 80% at 30% 28%, ${PEEN.rockA} 0%, ${PEEN.rockB} 35%, ${PEEN.rockC} 65%, ${PEEN.rockD} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* highlight pits */}
        <div style={{ position: 'absolute', left: '22%', top: '24%', width: '28%', height: '22%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,255,255,.32), rgba(255,255,255,0) 70%)' }}/>
        <div style={{ position: 'absolute', left: '60%', top: '54%', width: '22%', height: '18%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(0,0,0,.22), rgba(0,0,0,0) 70%)' }}/>
        <div style={{ position: 'absolute', left: '12%', top: '70%', width: '18%', height: '14%', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(0,0,0,.18), rgba(0,0,0,0) 70%)' }}/>
        {/* hatch texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(125deg, rgba(0,0,0,.12) 0 1px, transparent 1px 4px)',
          mixBlendMode: 'overlay', opacity: 0.5,
        }}/>
        {/* top facet sheen */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 36%)',
          mixBlendMode: 'soft-light',
        }}/>
      </div>
    </div>
  );
}

// ----- Chalk dust particle layer -----
function ChalkDust({ count = 18, intensity = 1 }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const seed = i * 53 + 11;
      const r = (a, b) => a + ((Math.sin(seed * 9.13) + 1) / 2) * (b - a);
      const r2 = (a, b) => a + ((Math.cos(seed * 7.71) + 1) / 2) * (b - a);
      const r3 = (a, b) => a + ((Math.sin(seed * 4.27) + 1) / 2) * (b - a);
      return {
        left: `${r(2, 98)}%`,
        size: r2(2, 8),
        dur: r3(12, 28) / Math.max(0.4, intensity),
        delay: -r(0, 24),
        drift: r2(-30, 30),
        opacity: r3(0.18, 0.5),
      };
    });
  }, [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <span key={i} className="peen-chalk" style={{
          position: 'absolute',
          left: p.left, bottom: -20,
          width: p.size, height: p.size, borderRadius: '50%',
          background: PEEN.tint,
          opacity: 0,
          animation: `peenChalk ${p.dur}s linear ${p.delay}s infinite`,
          ['--drift']: `${p.drift}px`,
          ['--peak']: p.opacity,
        }}/>
      ))}
    </div>
  );
}

// ----- CI pattern (climbing SF-symbol style) overlay -----
function BrandPattern({ opacity = 0.08 }) {
  const glyphs = [
    { name: 'mountain-snow', x: '8%',  y: '14%', s: 90,  r: -8 },
    { name: 'leaf',          x: '78%', y: '6%',  s: 72,  r: 14 },
    { name: 'climber',       x: '20%', y: '76%', s: 110, r: -4 },
    { name: 'compass',       x: '88%', y: '48%', s: 84,  r: 0 },
    { name: 'pin',           x: '56%', y: '20%', s: 60,  r: 6 },
    { name: 'carabiner',     x: '62%', y: '82%', s: 76,  r: -16 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {glyphs.map((g, i) => (
        <div key={i} style={{
          position: 'absolute', left: g.x, top: g.y,
          transform: `translate(-50%,-50%) rotate(${g.r}deg)`,
          opacity, color: PEEN.charcoal,
        }}>
          <PIcon name={g.name} size={g.s} color={PEEN.charcoal} strokeWidth={1.5}/>
        </div>
      ))}
    </div>
  );
}

// ----- Wordmark -----
function Wordmark({ size = 32, color, animated = false }) {
  const letters = 'peen'.split('');
  return (
    <span style={{
      fontFamily: PFONT, fontWeight: 700,
      fontSize: size, letterSpacing: '-1px',
      color: color || PEEN.fg1,
      display: 'inline-flex',
    }}>
      {animated ? letters.map((l, i) => (
        <span key={i} style={{
          display: 'inline-block',
          animation: `peenLetterIn .55s ${0.4 + i * 0.06}s cubic-bezier(.22,.61,.36,1) both`,
        }}>{l}</span>
      )) : 'peen'}
    </span>
  );
}

Object.assign(window, { PEEN, PFONT, PIcon, Reveal, RockBlob, ChalkDust, BrandPattern, Wordmark });
