// Landing page sections — Hero, Features, SendTypes, Phones gallery, Community, Stats, CTA, Footer
// Uses primitives.jsx + phone-screens.jsx

function Nav({ tweaks, setTweak }) {
  const APP_STORE_URL = 'https://apps.apple.com/th/app/peen-climbing-companion/id6759548288';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.harvestidea.peen&hl=en';
  const WEB_APP_URL = '/app/';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href={WEB_APP_URL} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: '#fff', color: PEEN.fg1,
          borderRadius: 999, fontFamily: PFONT, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', border: `1px solid ${PEEN.sep}`,
        }}>
          Use on web
        </a>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: PEEN.fg1, color: '#fff',
          borderRadius: 999, fontFamily: PFONT, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 6px 14px rgba(0,0,0,0.10)',
        }}>
          <PIcon name="apple" size={14} color="#fff"/> {tweaks.ctaText}
        </a>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 16px', background: PEEN.fg1, color: '#fff',
          borderRadius: 999, fontFamily: PFONT, fontSize: 13, fontWeight: 600,
          textDecoration: 'none', boxShadow: '0 6px 14px rgba(0,0,0,0.10)',
        }}>
          <PIcon name="google-play" size={14} color="#fff"/> Google Play
        </a>
      </div>
    </nav>
  );
}
