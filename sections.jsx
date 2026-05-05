// Landing page sections — Hero, Features, SendTypes, Phones gallery, Community, Stats, CTA, Footer
// Uses primitives.jsx + phone-screens.jsx

function Nav({ tweaks, setTweak }) {
  const APP_STORE_URL = 'https://apps.apple.com/th/app/peen-climbing-companion/id6759548288';
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '14px max(20px, 5vw)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(252,251,254,0.78)', backdropFilter: 'blur(14px) saturate(140%)',
      borderBottom: `1px solid ${PEEN.sep}`,
    }}>
      <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <img src="assets/app-icon.jpg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }}/>
        <Wordmark size={22}/>
      </a>
      <div className="peen-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {[['Features','#features'],['Send types','#sends'],['Community','#community'],['For gyms','#gyms']].map(([l,h]) => (
          <a key={l} href={h} style={{ fontFamily: PFONT, fontSize: 14, fontWeight: 500, color: PEEN.fg1, textDecoration: 'none', opacity: 0.85 }}>{l}</a>
        ))}
      </div>
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 16px', background: PEEN.fg1, color: '#fff',
        borderRadius: 999, fontFamily: PFONT, fontSize: 13, fontWeight: 600,
        textDecoration: 'none', boxShadow: '0 6px 14px rgba(0,0,0,0.10)',
      }}>
        <PIcon name="apple" size={14} color="#fff"/> {tweaks.ctaText}
      </a>
    </nav>
  );
}

function Hero({ tweaks }) {
  const APP_STORE_URL = 'https://apps.apple.com/th/app/peen-climbing-companion/id6759548288';
  return (
    <section id="top" style={{
      position: 'relative', minHeight: '100vh', overflow: 'hidden',
      background: PEEN.paper, paddingTop: 90,
    }}>
      {/* radial wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(900px 600px at 50% 8%, ${PEEN.tint}1A, transparent 70%)`,
      }}/>
      {/* rocks */}
      <RockBlob x="10%"  y="22%" w={260} h={170} rot={-12} opacity={0.55} phase={0}    intensity={tweaks.animationIntensity}/>
      <RockBlob x="92%"  y="18%" w={220} h={150} rot={14}  opacity={0.50} phase={0.7}  intensity={tweaks.animationIntensity}/>
      <RockBlob x="6%"   y="78%" w={360} h={240} rot={8}   opacity={0.65} phase={1.4}  intensity={tweaks.animationIntensity}/>
      <RockBlob x="94%"  y="84%" w={320} h={210} rot={-10} opacity={0.62} phase={2.0}  intensity={tweaks.animationIntensity}/>
      <RockBlob x="50%"  y="96%" w={420} h={260} rot={4}   opacity={0.40} phase={1.0}  intensity={tweaks.animationIntensity}/>

      <BrandPattern opacity={0.07}/>
      <ChalkDust count={Math.round(20 * tweaks.animationIntensity)} intensity={tweaks.animationIntensity}/>

      {/* haze */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(252,251,254,.45) 0%, rgba(252,251,254,.1) 30%, rgba(252,251,254,.65) 100%)' }}/>

      {/* content */}
      <div style={{
        position: 'relative', zIndex: 4, maxWidth: 1240, margin: '0 auto',
        padding: '40px max(20px, 5vw) 80px',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 40, alignItems: 'center',
      }} className="peen-hero-grid">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#fff', border: `1px solid ${PEEN.sep}`, marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PEEN.tint }}/>
            <span style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: PEEN.tint }}>peen · for local climbers</span>
          </div>

          <h1 style={{
            margin: 0, fontFamily: PFONT, fontWeight: 700,
            fontSize: 'clamp(44px, 6.4vw, 88px)', lineHeight: 0.98,
            letterSpacing: '-2px', color: PEEN.fg1,
          }}>
            <span style={{ display: 'block' }}>find climbing</span>
            <span style={{ display: 'block' }}>routes near</span>
            <span style={{ display: 'inline-block', position: 'relative' }}>
              <span style={{ position: 'relative', zIndex: 1 }}>you.</span>
              <span style={{
                position: 'absolute', left: -4, right: -4, bottom: 4, height: '36%',
                background: PEEN.tint, opacity: 0.22, borderRadius: 6,
                animation: 'peenHighlight 1.4s 1.2s cubic-bezier(.22,.61,.36,1) both',
                transformOrigin: 'left center',
              }}/>
            </span>
          </h1>

          <p style={{
            marginTop: 22, maxWidth: 520,
            fontFamily: PFONT, fontSize: 18, lineHeight: 1.5, color: PEEN.fg2,
          }}>
            log sends, find partners for the weekend, run gym sessions with your crew. {tweaks.tagline}
          </p>

          <div style={{ marginTop: 30, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 14,
              background: '#000', color: '#fff', textDecoration: 'none',
              fontFamily: PFONT, fontSize: 15, fontWeight: 600,
              boxShadow: '0 12px 22px rgba(0,0,0,0.18)',
              transition: 'transform .2s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = ''}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              <PIcon name="apple" size={18} color="#fff"/>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>Download on the</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>App Store</span>
              </span>
            </a>
            <a href="#community" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 14,
              background: 'rgba(255,255,255,0.7)', color: PEEN.fg1,
              border: `1px solid ${PEEN.sep}`, textDecoration: 'none',
              fontFamily: PFONT, fontSize: 15, fontWeight: 600,
              backdropFilter: 'blur(10px)',
            }} onClick={(e) => { e.preventDefault(); document.getElementById('community')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
              <PIcon name="play" size={12} color={PEEN.fg1}/> see the app
            </a>
          </div>

          {/* three-bullet rhythm — brand signature */}
          <div style={{ marginTop: 36, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: 'check-circle', text: 'route data—even offline' },
              { icon: 'compass',      text: 'plan trips with GPX' },
              { icon: 'people',       text: 'discover via your crew' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PIcon name={b.icon} size={18} color={PEEN.tint}/>
                <span style={{ fontFamily: PFONT, fontSize: 14, fontWeight: 500, color: PEEN.fg1 }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right: phone */}
        <div style={{ position: 'relative', minHeight: 560, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* mascot peeking */}
          <div className="peen-mascot-peek" style={{
            position: 'absolute', right: -6, top: -10, width: 110, height: 110,
            borderRadius: 22, overflow: 'hidden', zIndex: 3,
            boxShadow: '0 16px 32px rgba(0,0,0,0.20)',
            transform: 'rotate(-8deg)',
          }}>
            <img src="assets/app-icon.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>

          {/* floating chips */}
          <div style={{
            position: 'absolute', left: -10, top: 80,
            background: '#fff', borderRadius: 14, padding: '10px 14px',
            boxShadow: '0 18px 36px rgba(0,0,0,0.10)', zIndex: 3,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'peenFloat 4.2s ease-in-out infinite alternate',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: PEEN.tint + '24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PIcon name="check-circle" size={18} color={PEEN.tint}/>
            </div>
            <div>
              <div style={{ fontFamily: PFONT, fontSize: 13, fontWeight: 700, color: PEEN.fg1 }}>Crimson Arête</div>
              <div style={{ fontFamily: PFONT, fontSize: 11, color: PEEN.fg2 }}>Redpoint · 7b+ · 3 attempts</div>
            </div>
          </div>

          <div style={{
            position: 'absolute', right: -16, bottom: 70,
            background: '#fff', borderRadius: 14, padding: '10px 14px',
            boxShadow: '0 18px 36px rgba(0,0,0,0.10)', zIndex: 3,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'peenFloat 5.4s 0.8s ease-in-out infinite alternate-reverse',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${PEEN.exp}, ${PEEN.nav})`, color: '#fff', fontFamily: PFONT, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M</div>
            <div>
              <div style={{ fontFamily: PFONT, fontSize: 13, fontWeight: 700, color: PEEN.fg1 }}>Maya needs a belay</div>
              <div style={{ fontFamily: PFONT, fontSize: 11, color: PEEN.fg2 }}>Saturday · East Crag · 18:00</div>
            </div>
          </div>

          <PhoneFrame width={300} style={{ transform: 'perspective(1200px) rotateY(-12deg) rotateX(4deg)', boxShadow: '0 60px 100px rgba(0,0,0,0.22), 0 20px 40px rgba(0,0,0,0.12)' }}>
            <PhoneClimbs/>
          </PhoneFrame>
        </div>
      </div>

      <a href="#features" className="peen-scroll-hint" style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 5, color: PEEN.fg2, textDecoration: 'none',
        fontFamily: PFONT, fontSize: 12, fontWeight: 500,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <span>scroll</span>
        <span style={{ animation: 'peenBounce 1.8s ease-in-out infinite' }}>
          <PIcon name="arrow-down" size={16} color={PEEN.fg2}/>
        </span>
      </a>
    </section>
  );
}

// ----- Marquee strip of climbing terms -----
function Marquee() {
  const items = ['flash', 'onsight', 'redpoint', 'beta', 'send', 'project', 'crag', 'gym day', 'top rope', 'lead', 'anchor', 'pump', 'crux', 'rest day', 'flash', 'send card'];
  return (
    <div style={{
      background: PEEN.charcoal, color: '#fff', overflow: 'hidden',
      padding: '22px 0', borderTop: `1px solid ${PEEN.sep}`,
    }}>
      <div className="peen-marquee" style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap', width: 'max-content' }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 48, fontFamily: PFONT, fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {t}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PEEN.tint, display: 'inline-block' }}/>
          </span>
        ))}
      </div>
    </div>
  );
}

// ----- Features Section -----
function Features() {
  return (
    <section id="features" style={{ padding: '120px max(20px, 5vw)', background: '#fff', position: 'relative' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <Reveal>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: PEEN.tint }}>peen · what's inside</div>
          <h2 style={{ margin: '8px 0 0', fontFamily: PFONT, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-1.5px', color: PEEN.fg1, maxWidth: 760, lineHeight: 1.05 }}>
            track your climbs.<br/>find your people.<br/><span style={{ color: PEEN.tint }}>climb local.</span>
          </h2>
        </Reveal>

        <div className="peen-features-grid" style={{
          marginTop: 64, display: 'grid', gap: 20,
          gridTemplateColumns: 'repeat(12, 1fr)',
        }}>
          <Reveal delay={0} style={{ gridColumn: 'span 7' }}>
            <FeatureCard
              accent={PEEN.tint}
              eyebrow="log a climb"
              title="every send, every project, every burn."
              copy="grade, send-type, attempts, photos, ratings, beta. log it once, watch your pyramid grow."
              extra={<PhoneFrame width={210} style={{ position: 'absolute', right: -20, bottom: -40 }}><PhoneClimbs/></PhoneFrame>}
              tall
            />
          </Reveal>
          <Reveal delay={120} style={{ gridColumn: 'span 5' }}>
            <FeatureCard
              accent={PEEN.exp}
              eyebrow="find partners"
              title="don't climb alone."
              copy="post 'partner needed' or join a session. lead, top rope, anchor — match by criteria."
              icon="people"
            />
          </Reveal>
          <Reveal delay={0} style={{ gridColumn: 'span 5' }}>
            <FeatureCard
              accent={PEEN.nav}
              eyebrow="topo + approach"
              title="GPX-confident."
              copy="practical route data, even offline. follow the approach trail, find the start, send."
              icon="compass"
            />
          </Reveal>
          <Reveal delay={120} style={{ gridColumn: 'span 7' }}>
            <FeatureCard
              accent={PEEN.charcoal}
              eyebrow="stats"
              title="the grade pyramid you'll actually look at."
              copy="monthly progress, activity heatmap, achievements. zero clutter."
              extra={<PhoneFrame width={210} style={{ position: 'absolute', right: -20, bottom: -40 }}><PhoneStats/></PhoneFrame>}
              tall
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ accent, eyebrow, title, copy, icon, extra, tall }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: PEEN.surface, borderRadius: 24,
      padding: 32, height: tall ? 460 : 320,
      border: `1px solid ${PEEN.sep}`,
      transition: 'transform .35s, box-shadow .35s',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.08)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accent }}/>
      <div style={{ fontFamily: PFONT, fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: accent }}>{eyebrow}</div>
      <h3 style={{ margin: '12px 0 12px', fontFamily: PFONT, fontSize: 30, fontWeight: 700, letterSpacing: '-0.8px', color: PEEN.fg1, lineHeight: 1.1, maxWidth: 440 }}>{title}</h3>
      <p style={{ margin: 0, fontFamily: PFONT, fontSize: 16, lineHeight: 1.55, color: PEEN.fg2, maxWidth: 380 }}>{copy}</p>
      {icon && (
        <div style={{ position: 'absolute', right: 24, bottom: 24, width: 72, height: 72, borderRadius: 20, background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PIcon name={icon} size={36} color={accent} strokeWidth={1.6}/>
        </div>
      )}
      {extra}
    </div>
  );
}

// ----- Send Type Showcase -----
function SendTypes() {
  return (
    <section id="sends" style={{ padding: '120px max(20px, 5vw)', background: PEEN.charcoal, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <BrandPattern opacity={0.04}/>
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        <Reveal>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: PEEN.tint }}>peen · send types</div>
          <h2 style={{ margin: '8px 0 0', fontFamily: PFONT, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.05, maxWidth: 760 }}>
            log it the way you climbed it.
          </h2>
          <p style={{ marginTop: 16, maxWidth: 540, fontFamily: PFONT, fontSize: 18, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
            flash, onsight, redpoint, repeat, attempt, dog. every send-type has its own color and its own place on your card.
          </p>
        </Reveal>
        <div style={{
          marginTop: 48, display: 'grid', gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}>
          {SEND_TYPES.map((t, i) => (
            <Reveal key={t.id} delay={i * 60}>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 18, padding: '20px 18px',
                display: 'flex', flexDirection: 'column', gap: 10,
                position: 'relative', overflow: 'hidden',
                transition: 'border-color .3s, transform .3s, background .3s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + 'AA'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div style={{ position: 'absolute', right: -24, top: -24, width: 90, height: 90, borderRadius: '50%', background: t.color, opacity: 0.18, filter: 'blur(8px)' }}/>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: t.color + '24', color: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PIcon name={t.icon} size={22} color={t.color}/>
                </div>
                <div>
                  <div style={{ fontFamily: PFONT, fontSize: 18, fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontFamily: PFONT, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{t.desc}</div>
                </div>
                {/* Sample chip */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ padding: '2px 9px', borderRadius: 999, background: t.color, color: '#fff', fontFamily: PFONT, fontSize: 11, fontWeight: 700 }}>7b+</span>
                  <span style={{ padding: '2px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontFamily: PFONT, fontSize: 11, fontWeight: 500 }}>{t.id === 'flash' || t.id === 'onsight' ? '1 try' : '3 tries'}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- Phones gallery: 3 phones in a row -----
function PhonesGallery() {
  const phones = [
    { c: <PhoneCommunity/>, label: 'community', desc: 'find partners, run sessions' },
    { c: <PhoneLogin/>,     label: 'login',     desc: 'rocks, dust, start climbing' },
    { c: <PhoneStats/>,     label: 'stats',     desc: 'pyramid, streak, activity' },
  ];
  return (
    <section id="community" style={{
      padding: '120px max(20px, 5vw)',
      background: `linear-gradient(180deg, ${PEEN.paper} 0%, #fff 100%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <RockBlob x="-2%" y="50%" w={300} h={200} rot={20} opacity={0.35} phase={0.5} intensity={1}/>
      <RockBlob x="100%" y="30%" w={260} h={180} rot={-14} opacity={0.32} phase={1.2} intensity={1}/>

      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        <Reveal style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: PEEN.tint }}>peen · in the wild</div>
          <h2 style={{ margin: '8px 0 0', fontFamily: PFONT, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.05 }}>
            built for the gym, the crag, the carpool.
          </h2>
        </Reveal>

        <div className="peen-phones-row" style={{
          marginTop: 64, display: 'flex', justifyContent: 'center', gap: 32,
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          {phones.map((p, i) => (
            <Reveal key={i} delay={i * 120} style={{ textAlign: 'center' }}>
              <div style={{
                transform: i === 1 ? 'translateY(-20px)' : 'none',
                transition: 'transform .4s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = (i === 1 ? 'translateY(-30px)' : 'translateY(-10px)'); }}
              onMouseLeave={e => { e.currentTarget.style.transform = (i === 1 ? 'translateY(-20px)' : 'none'); }}
              >
                <PhoneFrame width={260}>{p.c}</PhoneFrame>
              </div>
              <div style={{ marginTop: 18, fontFamily: PFONT, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: PEEN.tint }}>{p.label}</div>
              <div style={{ marginTop: 4, fontFamily: PFONT, fontSize: 14, color: PEEN.fg2 }}>{p.desc}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- For Gyms split section with sandstone photo -----
function ForGyms({ tweaks }) {
  return (
    <section id="gyms" style={{ background: PEEN.charcoal, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div className="peen-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 540 }}>
        {tweaks.useSandstone && (
          <div style={{
            position: 'relative',
            backgroundImage: `url(assets/login-bg.jpg)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, transparent 0%, ${PEEN.charcoal} 100%)` }}/>
            <div style={{ position: 'absolute', left: 32, bottom: 32, fontFamily: PFONT, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>red sandstone · west crag · 4:21pm</div>
          </div>
        )}
        {!tweaks.useSandstone && (
          <div style={{ position: 'relative', background: PEEN.tint, overflow: 'hidden' }}>
            <BrandPattern opacity={0.18}/>
            <img src="assets/app-icon.jpg" alt="" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 280, height: 280, borderRadius: 56, boxShadow: '0 30px 60px rgba(0,0,0,0.30)' }}/>
          </div>
        )}
        <div style={{ padding: 'clamp(48px, 6vw, 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: PEEN.tint }}>peen · for gyms + crews</div>
          <h2 style={{ margin: '12px 0 0', fontFamily: PFONT, fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1.2px', lineHeight: 1.05 }}>
            climb local. climb together.
          </h2>
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 460 }}>
            {[
              ['partner posts + weekend plans','people'],
              ['events + local community updates','pin'],
              ['log climbs + share your sends','check-circle'],
            ].map(([t,i],k) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PIcon name={i} size={18} color={PEEN.tint}/>
                </div>
                <span style={{ fontFamily: PFONT, fontSize: 17, color: 'rgba(255,255,255,0.85)' }}>{t}</span>
              </div>
            ))}
          </div>
          <a href="mailto:hello@peen.app?subject=Launch%20flyer%20for%20my%20gym&body=Tell%20us%20about%20your%20gym%20%2F%20crag%20and%20we%27ll%20send%20a%20flyer%20pack." style={{ marginTop: 32, padding: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 16, maxWidth: 460, display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit', transition: 'background .25s, border-color .25s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = PEEN.tint + '66'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PIcon name="qr" size={32} color={PEEN.charcoal} strokeWidth={1.6}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: PFONT, fontSize: 14, fontWeight: 700, color: '#fff' }}>scan to join peen</div>
              <div style={{ fontFamily: PFONT, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>print a flyer for your gym → tag us, we'll repost</div>
            </div>
            <PIcon name="arrow-right" size={18} color="rgba(255,255,255,0.6)"/>
          </a>
        </div>
      </div>
    </section>
  );
}

// ----- Final CTA -----
function FinalCTA({ tweaks }) {
  const APP_STORE_URL = 'https://apps.apple.com/th/app/peen-climbing-companion/id6759548288';
  return (
    <section id="download" style={{
      padding: '120px max(20px, 5vw)',
      background: PEEN.paper, position: 'relative', overflow: 'hidden',
    }}>
      <RockBlob x="12%" y="50%" w={420} h={280} rot={-8} opacity={0.4} phase={0} intensity={tweaks.animationIntensity}/>
      <RockBlob x="88%" y="50%" w={420} h={280} rot={10} opacity={0.4} phase={1.2} intensity={tweaks.animationIntensity}/>
      <ChalkDust count={Math.round(14 * tweaks.animationIntensity)} intensity={tweaks.animationIntensity}/>

      <div style={{ position: 'relative', zIndex: 4, maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
        <Reveal>
          <img src="assets/app-icon.jpg" alt="" style={{ width: 96, height: 96, borderRadius: 22, boxShadow: '0 16px 32px rgba(0,0,0,0.18)' }}/>
        </Reveal>
        <Reveal delay={120}>
          <h2 style={{ margin: '24px 0 0', fontFamily: PFONT, fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1, color: PEEN.fg1 }}>
            your climbing week,<br/>in one place.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p style={{ marginTop: 22, fontFamily: PFONT, fontSize: 18, color: PEEN.fg2 }}>
            we built peen for local climbers. if you climb in your city, try it this week.
          </p>
        </Reveal>
        <Reveal delay={280}>
          <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 26px', borderRadius: 14,
              background: '#000', color: '#fff', textDecoration: 'none',
              fontFamily: PFONT, fontSize: 16, fontWeight: 600,
              boxShadow: '0 12px 22px rgba(0,0,0,0.18)',
            }}>
              <PIcon name="apple" size={20} color="#fff"/>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.75 }}>Download on the</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>App Store</span>
              </span>
            </a>
            <a href="mailto:hello@peen.app?subject=Launch%20flyer%20for%20my%20gym" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 26px', borderRadius: 14,
              background: '#fff', color: PEEN.fg1, border: `1px solid ${PEEN.sep}`,
              textDecoration: 'none', fontFamily: PFONT, fontSize: 16, fontWeight: 600,
            }}>
              <PIcon name="qr" size={18} color={PEEN.fg1}/> get a launch flyer
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Footer -----
function Footer() {
  return (
    <footer style={{ background: PEEN.charcoal, color: 'rgba(255,255,255,0.7)', padding: '64px max(20px, 5vw) 32px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="assets/app-icon.jpg" alt="" style={{ width: 36, height: 36, borderRadius: 8 }}/>
            <Wordmark size={28} color="#fff"/>
          </div>
          <p style={{ marginTop: 14, fontFamily: PFONT, fontSize: 13, lineHeight: 1.6 }}>
            a local climbing app — log routes, find partners, build community at your gym and crag.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          {[
            { h: 'product', items: [['Features','#features'],['Send types','#sends'],['Stats','#community'],['Maps','#community']] },
            { h: 'community', items: [['Crew','#community'],['Partners','#community'],['Challenges','#community']] },
            { h: 'company', items: [['About','#top'],['Privacy','mailto:hello@peen.app?subject=Privacy'],['Terms','mailto:hello@peen.app?subject=Terms'],['Press kit','mailto:hello@peen.app?subject=Press%20kit']] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: PFONT, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: PEEN.tint, marginBottom: 12 }}>{col.h}</div>
              {col.items.map(([label, href]) => (
                <a key={label} href={href} style={{ display: 'block', fontFamily: PFONT, fontSize: 14, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', padding: '4px 0' }}>{label}</a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1240, margin: '48px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontFamily: PFONT, fontSize: 12 }}>
        <span>© 2026 peen — climb local.</span>
        <span>made by climbers, for climbers.</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Hero, Marquee, Hero3DSection, Features, FeatureCard, SendTypes, PhonesGallery, ForGyms, FinalCTA, Footer });

function Hero3DSection({ tweaks }) {
  return (
    <section style={{ position: 'relative', background: `linear-gradient(180deg, ${PEEN.charcoal} 0%, #2a2a2c 100%)`, color: '#fff', overflow: 'hidden', padding: '0 0 0' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(60% 50% at 50% 30%, ${PEEN.tint}22, transparent 70%)` }}/>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '100px max(20px, 5vw) 40px', position: 'relative', zIndex: 2 }}>
        <Reveal style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: PEEN.tint }}>peen · the crag, in your pocket</div>
          <h2 style={{ margin: '8px 0 0', fontFamily: PFONT, fontSize: 'clamp(40px, 5.5vw, 76px)', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1.0 }}>
            real rock. <span style={{ color: PEEN.tint }}>real climbers.</span>
          </h2>
          <p style={{ marginTop: 14, fontFamily: PFONT, fontSize: 17, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
            move your cursor — the mountain follows.
          </p>
        </Reveal>
      </div>
      <div style={{ position: 'relative', height: 'clamp(420px, 60vh, 640px)' }}>
        <Hero3D height="100%" intensity={tweaks.animationIntensity}/>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, background: `linear-gradient(0deg, ${PEEN.charcoal}, transparent)`, pointerEvents: 'none' }}/>
      </div>
    </section>
  );
}

window.Hero3DSection = Hero3DSection;
