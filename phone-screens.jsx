// Mini phone mockup + climb cards + send-type tiles for landing page

const SEND_TYPES = [
  { id: 'flash',    color: PEEN.flash,  icon: 'bolt',           label: 'Flash',     desc: 'first-try send' },
  { id: 'onsight',  color: PEEN.nav,    icon: 'eye',            label: 'Onsight',   desc: 'no beta, first try' },
  { id: 'redpoint', color: PEEN.tint,   icon: 'check-circle',   label: 'Redpoint',  desc: 'clean after work' },
  { id: 'repeat',   color: PEEN.exp,    icon: 'repeat',         label: 'Repeat',    desc: 'send it again' },
  { id: 'attempt',  color: '#D55A1FCC', icon: 'arrow-up-circle',label: 'Attempt',   desc: 'logged the burn' },
  { id: 'dog',      color: PEEN.purple, icon: 'climber',        label: 'Dog',       desc: 'hangdog / project' },
];

function SendTypeTile({ type }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${PEEN.sep}`,
      borderRadius: 18,
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'transform .3s, box-shadow .3s, border-color .3s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = type.color + '66'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = PEEN.sep; }}
    >
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: type.color, opacity: 0.08,
      }}/>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: type.color + '24',
        color: type.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PIcon name={type.icon} size={20} color={type.color}/>
      </div>
      <div>
        <div style={{ fontFamily: PFONT, fontSize: 17, fontWeight: 700, color: PEEN.fg1 }}>{type.label}</div>
        <div style={{ fontFamily: PFONT, fontSize: 13, color: PEEN.fg2, marginTop: 2 }}>{type.desc}</div>
      </div>
    </div>
  );
}

// ----- iPhone-style frame at landing-page scale -----
function PhoneFrame({ children, width = 280, scale = 1, tilt = 0, style = {} }) {
  const w = width;
  const h = w * (812 / 375); // ~2.165 aspect
  return (
    <div style={{
      width: w, height: h,
      borderRadius: w * 0.13,
      background: '#0c0c0d',
      padding: 8,
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 8px 18px rgba(0,0,0,0.10), inset 0 0 0 1.5px #2a2a2c',
      transform: `scale(${scale}) rotate(${tilt}deg)`,
      transformOrigin: 'center',
      ...style,
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: w * 0.105,
        background: '#fff',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* dynamic island */}
        <div style={{
          position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)',
          width: w * 0.32, height: w * 0.085,
          background: '#0c0c0d', borderRadius: 999, zIndex: 5,
        }}/>
        {children}
      </div>
    </div>
  );
}

// ----- Compact iOS status bar -----
function PhoneStatus({ tint = PEEN.fg1 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 22px 4px', fontFamily: PFONT, fontWeight: 600, fontSize: 13,
      color: tint,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10 }}>●●●</span>
        <span style={{ fontSize: 10 }}>􀙇</span>
        <span style={{
          display: 'inline-block', width: 22, height: 11,
          border: `1px solid ${tint}`, borderRadius: 3, position: 'relative', opacity: 0.85,
        }}>
          <span style={{ position: 'absolute', inset: 1, background: tint, borderRadius: 1 }}/>
        </span>
      </div>
    </div>
  );
}

// ===== Phone screens =====

// 1) HOME / LOGIN scene (mini)
function PhoneLogin() {
  return (
    <div style={{ height: '100%', position: 'relative', background: PEEN.paper, overflow: 'hidden' }}>
      <PhoneStatus/>
      {/* 4 mini rocks */}
      <RockBlob x="22%" y="20%" w={120} h={80} rot={-10} opacity={0.55} phase={0} intensity={1}/>
      <RockBlob x="80%" y="26%" w={100} h={70} rot={12} opacity={0.50} phase={0.7} intensity={1}/>
      <RockBlob x="18%" y="78%" w={150} h={100} rot={6} opacity={0.65} phase={1.4} intensity={1}/>
      <RockBlob x="82%" y="84%" w={130} h={90} rot={-12} opacity={0.6} phase={2.0} intensity={1}/>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(252,251,254,.55), rgba(252,251,254,.3) 50%, rgba(252,251,254,.85))' }}/>
      <ChalkDust count={10} intensity={1}/>
      <div style={{ position: 'absolute', inset: 0, padding: '64px 22px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 3 }}>
        <img src="assets/app-icon.jpg" alt="" style={{ width: 86, height: 86, borderRadius: 20, boxShadow: '0 8px 18px rgba(0,0,0,.18)' }}/>
        <div style={{ fontFamily: PFONT, fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', color: PEEN.fg1, marginTop: 18 }}>Peen</div>
        <div style={{ fontFamily: PFONT, fontSize: 13, color: PEEN.fg2, marginTop: 4, maxWidth: 200 }}>find climbing routes near you</div>
        <div style={{ width: '100%', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['Practical route data—even offline','Plan trips with GPX confidence','Discover routes via the community'].map((t,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left' }}>
              <PIcon name={['check-circle','compass','people'][i]} size={16} color={PEEN.tint}/>
              <span style={{ fontFamily: PFONT, fontSize: 12, color: PEEN.fg1 }}>{t}</span>
            </div>
          ))}
        </div>
        <button style={{
          marginTop: 'auto', width: '100%', height: 44, borderRadius: 14, border: 'none',
          background: '#000', color: '#fff', fontFamily: PFONT, fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 10px 14px rgba(0,0,0,.14)',
        }}>
          <PIcon name="apple" size={14} color="#fff"/> Continue with Apple
        </button>
      </div>
    </div>
  );
}

// 2) CLIMBS feed
function PhoneClimbs() {
  const climbs = [
    { name: 'Crimson Arête', loc: 'Red Wall · East Crag', grade: '7b+', send: 'redpoint', date: '04 May', stars: 4 },
    { name: 'Slab of Glory', loc: 'Boulder Brook',         grade: '6c',  send: 'flash',    date: '02 May', stars: 3 },
    { name: 'Granite Spine', loc: 'Westside Gym',          grade: '7a',  send: 'onsight',  date: '28 Apr', stars: 5 },
    { name: 'Pumpkin Roof',  loc: 'Orange Wall',           grade: '7c',  send: 'attempt',  date: '25 Apr', stars: 0 },
    { name: 'Mossy Corner',  loc: 'East Crag',             grade: '6b+', send: 'repeat',   date: '20 Apr', stars: 3 },
  ];
  const filters = ['All','Sent','Projects','This Month'];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PhoneStatus/>
      <div style={{ padding: '4px 16px 6px' }}>
        <div style={{ fontFamily: PFONT, fontSize: 26, fontWeight: 700, letterSpacing: '-0.6px', color: PEEN.fg1 }}>My Climbs</div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '4px 16px 8px', overflowX: 'hidden' }}>
        {filters.map((f, i) => (
          <span key={f} style={{
            padding: '5px 10px', borderRadius: 999,
            background: i === 0 ? PEEN.tint + '2E' : PEEN.fieldFill,
            fontFamily: PFONT, fontSize: 12, fontWeight: 500, color: PEEN.fg1, whiteSpace: 'nowrap',
          }}>{f}</span>
        ))}
      </div>
      <div style={{ flex: 1, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
        {climbs.map((c, i) => {
          const meta = SEND_TYPES.find(s => s.id === c.send);
          return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: 10, background: PEEN.surface, borderRadius: 12 }}>
              <div style={{ width: 3, borderRadius: 2, background: meta.color, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: PFONT, fontSize: 13, fontWeight: 700, color: PEEN.fg1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontFamily: PFONT, fontSize: 10, color: PEEN.fg2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.loc}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ padding: '1px 8px', borderRadius: 999, background: meta.color, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: PFONT }}>{c.grade}</span>
                    <div style={{ fontFamily: PFONT, fontSize: 9, color: PEEN.fg2, marginTop: 2 }}>{c.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontFamily: PFONT, fontSize: 10, color: PEEN.fg2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: meta.color }}>
                    <PIcon name={meta.icon} size={10} color={meta.color}/> {meta.label}
                  </span>
                  {c.stars > 0 && <><span style={{ color: PEEN.fg3 }}>·</span><span style={{ color: '#FFC000', letterSpacing: -1 }}>{'★'.repeat(c.stars)}</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <PhoneTabBar active="climbs"/>
    </div>
  );
}

// 3) COMMUNITY screen
function PhoneCommunity() {
  const events = [
    { title: 'Saturday lead session', creator: 'Maya R.', date: '10/05', time: '18:00–21:00', crit: ['Lead','Anchor','7a min'], booked: false, joined: 3 },
    { title: 'Sunday slab project',   creator: 'Jonas K.', date: '11/05', time: '10:00–14:00', crit: ['Belay TR'], booked: false, joined: 2 },
    { title: 'Beginner-friendly TR',  creator: 'Alex Y.',  date: '14/05', time: '17:30–20:00', crit: ['Belay TR'], booked: true, joined: 4 },
  ];
  const critColor = (l) => l.includes('Lead') || l.includes('Belay') ? PEEN.exp : l.includes('Anchor') ? PEEN.tint : PEEN.nav;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PhoneStatus/>
      <div style={{ padding: '4px 16px 6px' }}>
        <div style={{ fontFamily: PFONT, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: PEEN.tint, textTransform: 'uppercase' }}>peen · community</div>
        <div style={{ fontFamily: PFONT, fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px', color: PEEN.fg1, marginTop: 1 }}>Climb together</div>
      </div>
      <div style={{ padding: '6px 16px 8px' }}>
        <div style={{ display: 'flex', padding: 2, background: PEEN.fieldFill, borderRadius: 999 }}>
          {['Crew','Partners','Challenges'].map((t, i) => (
            <div key={t} style={{
              flex: 1, textAlign: 'center', padding: '6px 0',
              background: i === 0 ? '#fff' : 'transparent',
              borderRadius: 999, fontFamily: PFONT, fontSize: 11, fontWeight: 600,
              color: i === 0 ? PEEN.fg1 : PEEN.fg2,
              boxShadow: i === 0 ? '0 1px 1px rgba(0,0,0,.04)' : 'none',
            }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {events.map((e, i) => (
          <div key={i} style={{ padding: 11, background: e.booked ? PEEN.surface : '#fff', border: `1px solid ${PEEN.sep}`, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: PFONT, fontSize: 13, fontWeight: 700, color: PEEN.fg1 }}>{e.title}</div>
                <div style={{ fontFamily: PFONT, fontSize: 10, color: PEEN.fg2 }}>by {e.creator} · {e.date} {e.time}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${PEEN.tint}, ${PEEN.nav})`, flexShrink: 0 }}/>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {e.crit.map((l, j) => (
                <span key={j} style={{
                  padding: '1px 8px', borderRadius: 999,
                  background: critColor(l) + '4D', color: PEEN.fg1,
                  fontFamily: PFONT, fontSize: 9, fontWeight: 700,
                }}>{l}</span>
              ))}
              {e.booked && <span style={{ padding: '1px 8px', borderRadius: 999, background: PEEN.fg1, color: '#fff', fontFamily: PFONT, fontSize: 9, fontWeight: 600 }}>Fully booked</span>}
            </div>
          </div>
        ))}
      </div>
      <PhoneTabBar active="community"/>
    </div>
  );
}

// 4) STATS
function PhoneStats() {
  const tiles = [
    { v: '42', l: 'Sends', c: PEEN.tint }, { v: '7b+', l: 'Top Grade', c: PEEN.nav }, { v: '5d', l: 'Streak', c: PEEN.exp },
    { v: '12', l: 'This Month', c: PEEN.tint }, { v: '9', l: 'Flashes', c: PEEN.flash }, { v: '3', l: 'Onsights', c: PEEN.nav },
  ];
  const pyramid = [{g:'7c',n:1},{g:'7b+',n:3},{g:'7b',n:5},{g:'7a+',n:8},{g:'7a',n:12},{g:'6c+',n:9},{g:'6c',n:4}];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PhoneStatus/>
      <div style={{ padding: '4px 16px 8px', borderBottom: `0.5px solid ${PEEN.sep}` }}>
        <div style={{ fontFamily: PFONT, fontSize: 14, fontWeight: 700, color: PEEN.fg1, textAlign: 'center' }}>Stats</div>
      </div>
      <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {tiles.map((t, i) => (
            <div key={i} style={{ background: t.c + '40', padding: 8, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: PFONT, fontSize: 16, fontWeight: 700, color: PEEN.fg1 }}>{t.v}</div>
              <div style={{ fontFamily: PFONT, fontSize: 9, color: PEEN.fg2, marginTop: 1 }}>{t.l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: PEEN.surface, borderRadius: 10, padding: 10 }}>
          <div style={{ fontFamily: PFONT, fontSize: 12, fontWeight: 700, marginBottom: 6, color: PEEN.fg1 }}>Grade Pyramid</div>
          {pyramid.map(b => (
            <div key={b.g} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
              <span style={{ width: 24, fontFamily: PFONT, fontSize: 9, fontWeight: 600, color: PEEN.fg2 }}>{b.g}</span>
              <div style={{ flex: 1, height: 9, background: '#fff', borderRadius: 3, overflow: 'hidden' }}>
                <div className="peen-pyramid-bar" style={{ width: `${(b.n/12)*100}%`, height: '100%', background: PEEN.tint, borderRadius: 3 }}/>
              </div>
              <span style={{ width: 14, fontFamily: PFONT, fontSize: 9, color: PEEN.fg2, textAlign: 'right' }}>{b.n}</span>
            </div>
          ))}
        </div>
      </div>
      <PhoneTabBar active="stats"/>
    </div>
  );
}

function PhoneTabBar({ active }) {
  const tabs = [
    { id: 'climbs', icon: 'mountain', label: 'Climbs' },
    { id: 'community', icon: 'people', label: 'Community' },
    { id: 'stats', icon: 'chart', label: 'Stats' },
    { id: 'profile', icon: 'home', label: 'Profile' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '6px 8px 14px', background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)', borderTop: `0.5px solid ${PEEN.sep}`,
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <PIcon name={t.icon} size={18} color={on ? PEEN.tint : PEEN.fg2}/>
            <span style={{ fontFamily: PFONT, fontSize: 8.5, fontWeight: on ? 600 : 500, color: on ? PEEN.tint : PEEN.fg2 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  SEND_TYPES, SendTypeTile, PhoneFrame, PhoneStatus,
  PhoneLogin, PhoneClimbs, PhoneCommunity, PhoneStats,
});
