import { Link } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';

// ─── Inline styles as constants to keep the component clean ───────────────────

const S = {
  // Hero
  hero: {
    minHeight: '88vh',
    background: 'linear-gradient(135deg, #360d63 0%, #4d148c 55%, #6a22b8 100%)',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    padding: '60px 80px',
    position: 'relative' as const,
    overflow: 'hidden',
    gap: '48px',
  } as React.CSSProperties,
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,.12)',
    border: '1px solid rgba(255,255,255,.25)',
    color: '#ffd2b0',
    fontSize: '.82rem',
    fontWeight: 700,
    letterSpacing: '.5px',
    padding: '6px 16px',
    borderRadius: '20px',
    marginBottom: '24px',
  } as React.CSSProperties,
  heroBadgeDot: {
    width: '8px',
    height: '8px',
    background: '#ff6200',
    borderRadius: '50%',
    display: 'inline-block',
  } as React.CSSProperties,
  heroH1: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '3.6rem',
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#ffffff',
    marginBottom: '20px',
  } as React.CSSProperties,
  heroSub: {
    color: 'rgba(255,255,255,.8)',
    fontSize: '1.05rem',
    lineHeight: 1.7,
    maxWidth: '460px',
    marginBottom: '36px',
  } as React.CSSProperties,
  heroCtas: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  btnPrimary: {
    background: '#ff6200',
    color: '#ffffff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    padding: '14px 30px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 8px 24px rgba(255,98,0,.4)',
  } as React.CSSProperties,
  btnSecondary: {
    background: 'rgba(255,255,255,.1)',
    color: '#ffffff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '1rem',
    padding: '14px 30px',
    borderRadius: '14px',
    border: '2px solid rgba(255,255,255,.3)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  } as React.CSSProperties,
  storeBadges: {
    display: 'flex',
    gap: '12px',
    marginTop: '28px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  storeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#1a0a2e',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '10px 18px',
    fontSize: '.82rem',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,.1)',
  } as React.CSSProperties,
};

export function HomePage() {
  return (
    <div>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Poppins:wght@400;500;600;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes acme-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
        @keyframes acme-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .acme-pulse { animation: acme-pulse 2s infinite; }
        .acme-float { animation: acme-float 3s ease-in-out infinite; }
        .acme-float-delay { animation: acme-float 3s ease-in-out .5s infinite; }
        .acme-cat-card { transition: transform .25s, box-shadow .25s; }
        .acme-cat-card:hover { transform: translateY(-6px); }
        .acme-feat-card { transition: border-color .2s, transform .2s, box-shadow .2s; }
        .acme-feat-card:hover { border-color: #4d148c !important; transform: translateY(-4px); box-shadow: 0 16px 40px rgba(77,20,140,.12) !important; }
        .acme-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,98,0,.5) !important; }
        .acme-btn-secondary:hover { background: rgba(255,255,255,.18) !important; }
        .acme-nav-link:hover { background: #f0e8ff; color: #4d148c !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={S.hero}>
        {/* decorative circles */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,98,0,.25) 0%, transparent 70%)',
          right: '-100px', top: '-100px', pointerEvents: 'none',
        }} />

        {/* Left: text */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={S.heroBadge}>
            <span className="acme-pulse" style={S.heroBadgeDot} />
            Huancavelica ya tiene delivery
          </div>
          <h1 style={S.heroH1}>
            ¿Lo quieres?<br />
            <span style={{ color: '#ff6200' }}>¡Lo tienes!</span>
          </h1>
          <p style={S.heroSub}>
            Somos la primera plataforma de delivery 100% local en{' '}
            <strong style={{ color: '#ff8533' }}>Huancavelica</strong>. Pedidos rápidos,
            seguimiento en tiempo real, y tus negocios favoritos en un solo lugar.
          </p>
          <div style={S.heroCtas}>
            <Link to={AppRoutes.public.downloads} className="acme-btn-primary" style={S.btnPrimary}>
              Ordenar ahora
            </Link>
            <Link to={AppRoutes.public.businesses} className="acme-btn-secondary" style={S.btnSecondary}>
              Afilia tu negocio
            </Link>
          </div>
          <div style={S.storeBadges}>
            <a href="#" style={S.storeBadge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5v-17c0-.83 1-1.3 1.7-.8l14 8.5c.7.4.7 1.5 0 1.9l-14 8.5c-.7.5-1.7.03-1.7-.8z" fill="#4caf50"/>
              </svg>
              <span>
                <small style={{ display: 'block', fontSize: '.65rem', opacity: .7 }}>Disponible en</small>
                Google Play
              </span>
            </a>
            <a href="#" style={S.storeBadge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>
                <small style={{ display: 'block', fontSize: '.65rem', opacity: .7 }}>Disponible en</small>
                App Store
              </span>
            </a>
          </div>
        </div>

        {/* Right: phone mockup */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            {/* Float badges */}
            <div className="acme-float-delay" style={{
              position: 'absolute', left: '-30px', top: '30%',
              background: '#ff6200', color: '#fff', borderRadius: '14px',
              padding: '8px 14px', fontSize: '.78rem', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(255,98,0,.4)', zIndex: 10,
            }}>🛵 30 min</div>
            <div className="acme-float" style={{
              position: 'absolute', right: '-30px', bottom: '30%',
              background: '#ff6200', color: '#fff', borderRadius: '14px',
              padding: '8px 14px', fontSize: '.78rem', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(255,98,0,.4)', zIndex: 10,
            }}>⭐ 4.9 rating</div>

            {/* Phone */}
            <div style={{
              width: '280px', height: '520px',
              background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1060 100%)',
              borderRadius: '40px',
              border: '3px solid rgba(255,255,255,.15)',
              boxShadow: '0 30px 80px rgba(0,0,0,.5)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* phone header */}
              <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '.9rem', color: '#fff' }}>
                  Acme <span style={{ color: '#ff6200' }}>Pedidos</span>
                </span>
                <span style={{ background: 'rgba(255,98,0,.2)', color: '#ff8533', fontSize: '.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                  📍 Huancavelica
                </span>
              </div>
              {/* search */}
              <div style={{ margin: '0 16px 14px', background: 'rgba(255,255,255,.08)', borderRadius: '12px', padding: '10px 14px', color: 'rgba(255,255,255,.4)', fontSize: '.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔍 Buscar restaurantes...
              </div>
              {/* chips */}
              <div style={{ display: 'flex', gap: '8px', padding: '0 16px 14px', overflow: 'hidden' }}>
                {[['🍔 Todo', true], ['🍕 Comida', false], ['🛒 Market', false]].map(([label, active]) => (
                  <span key={label as string} style={{
                    flexShrink: 0, borderRadius: '20px', padding: '6px 14px',
                    fontSize: '.72rem', fontWeight: 600,
                    background: active ? '#ff6200' : 'rgba(255,255,255,.07)',
                    color: active ? '#fff' : 'rgba(255,255,255,.7)',
                  }}>{label as string}</span>
                ))}
              </div>
              {/* cards */}
              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '🍔', bg: 'rgba(255,98,0,.15)', name: 'El Rincón Huancaíno', meta: 'Pollos · Platos típicos', time: '20 min' },
                  { icon: '🍕', bg: 'rgba(77,20,140,.15)', name: 'Pizzería Andina', meta: 'Pizzas · Pastas', time: '25 min' },
                  { icon: '🥗', bg: 'rgba(0,184,148,.15)', name: 'Frescos Market', meta: 'Supermercado local', time: '35 min' },
                ].map(r => (
                  <div key={r.name} style={{
                    background: 'rgba(255,255,255,.07)', borderRadius: '14px', padding: '12px 14px',
                    display: 'flex', gap: '12px', alignItems: 'center',
                    border: '1px solid rgba(255,255,255,.06)',
                  }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '.82rem', fontWeight: 700 }}>{r.name}</div>
                      <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.72rem', marginTop: 2 }}>{r.meta}</div>
                    </div>
                    <span style={{ color: '#ff6200', fontSize: '.75rem', fontWeight: 700 }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <div style={{ background: '#f5f5f8', padding: '36px 80px', textAlign: 'center' }}>
        <p style={{ color: '#5b4b78', fontSize: '.85rem', fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: '22px' }}>
          Negocios que confían en nosotros
        </p>
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['El Rincón', 'Pizzería Andina', 'Frescos Market', 'Pollo Express', 'Tienda Central'].map(b => (
            <div key={b} style={{
              background: '#fff', borderRadius: '12px', padding: '12px 24px',
              fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '.95rem',
              color: '#b0a0c0', border: '1px solid #ede8f7',
            }}>{b}</div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: '80px', textAlign: 'center' }}>
        <div style={{ color: '#ff6200', fontSize: '.82rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
          ¡Encuentra más!
        </div>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1a0a2e', marginBottom: '48px' }}>
          Todo lo que <span style={{ color: '#4d148c' }}>necesitas</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { emoji: '🍔', label: 'Restaurantes', grad: 'linear-gradient(145deg, #ff6200, #ff9a55)', shadow: 'rgba(255,98,0,.3)' },
            { emoji: '🛒', label: 'Supermercados', grad: 'linear-gradient(145deg, #4d148c, #7b2fd4)', shadow: 'rgba(77,20,140,.3)' },
            { emoji: '🍾', label: 'Licores', grad: 'linear-gradient(145deg, #00b894, #00d4aa)', shadow: 'rgba(0,184,148,.3)' },
            { emoji: '🎁', label: 'Regalos', grad: 'linear-gradient(145deg, #0984e3, #74b9ff)', shadow: 'rgba(9,132,227,.3)' },
          ].map(c => (
            <a key={c.label} href="#" className="acme-cat-card" style={{
              borderRadius: '22px', padding: '36px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              textDecoration: 'none', fontWeight: 800, fontSize: '1rem', color: '#fff',
              background: c.grad, boxShadow: `0 12px 32px ${c.shadow}`,
            }}>
              <span style={{ fontSize: '2.6rem' }}>{c.emoji}</span>
              {c.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: 'linear-gradient(135deg, #fdf6ff 0%, #fff5f0 100%)', padding: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ color: '#ff6200', fontSize: '.82rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            ¿Por qué elegirnos?
          </div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1a0a2e' }}>
            Características <span style={{ color: '#4d148c' }}>destacadas</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
          {[
            { icon: '🛵', bg: 'rgba(255,98,0,.1)', title: 'Pide lo que quieras', desc: 'Manda y pide desde restaurantes, tiendas y negocios locales de Huancavelica directamente a tu puerta.' },
            { icon: '📍', bg: 'rgba(77,20,140,.1)', title: 'Seguimiento en vivo', desc: 'Sigue tu pedido o envío durante todo el camino con rastreo en tiempo real en el mapa.' },
            { icon: '⚡', bg: 'rgba(0,184,148,.1)', title: 'Tiempo récord', desc: 'Recibe tus pedidos en tiempo récord. Promedio de entrega de 30 minutos en toda la ciudad.' },
          ].map(f => (
            <div key={f.title} className="acme-feat-card" style={{
              background: '#fff', borderRadius: '22px', padding: '36px 28px',
              border: '2px solid transparent', cursor: 'default',
            }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1a0a2e', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: '#5b4b78', fontSize: '.9rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CITY ── */}
      <section style={{ padding: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#ff6200', fontSize: '.82rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Cobertura</div>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '2.4rem', color: '#1a0a2e', marginBottom: '20px' }}>
            La app de delivery que <span style={{ color: '#4d148c' }}>llegó a Huancavelica</span>
          </h2>
          <p style={{ color: '#5b4b78', lineHeight: 1.8, marginBottom: '28px' }}>
            Somos la primera plataforma de delivery local que conecta a los huancavelicanos con sus negocios favoritos. Comenzamos aquí y seguiremos creciendo.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'linear-gradient(135deg, #4d148c, #6a22b8)',
            color: '#fff', padding: '14px 28px', borderRadius: '16px',
            fontWeight: 800, fontSize: '1.1rem',
            boxShadow: '0 10px 30px rgba(77,20,140,.3)',
          }}>
            <span>📍</span> Huancavelica — Activo ahora
          </div>
          <p style={{ marginTop: '18px', fontSize: '.88rem', color: '#5b4b78' }}>
            Próximamente expandiéndonos a más ciudades de la región.
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(145deg, #360d63, #4d148c)',
          borderRadius: '28px', padding: '48px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
          boxShadow: '0 24px 60px rgba(77,20,140,.35)',
          position: 'relative', overflow: 'hidden',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '4rem' }}>🗺️</span>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#fff' }}>Huancavelica</div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', marginTop: '-12px' }}>Región Huancavelica, Perú</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[['30\'', 'Entrega promedio'], ['100%', 'Local y peruano']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#ff6200' }}>{num}</div>
                <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.75rem' }}>{label}</div>
              </div>
            ))}
          </div>
          <span style={{ background: '#ff6200', color: '#fff', fontSize: '.78rem', fontWeight: 800, padding: '6px 16px', borderRadius: '20px', letterSpacing: '.5px' }}>
            + Más ciudades próximamente
          </span>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #360d63 0%, #4d148c 60%, #ff6200 150%)',
        padding: '90px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 900, fontSize: '2.8rem', color: '#fff', marginBottom: '14px' }}>
          Descubre Acme Pedidos
        </h2>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1.05rem', marginBottom: '36px' }}>
          Llevamos lo que quieras, hasta donde quieras.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={AppRoutes.public.downloads} className="acme-btn-primary" style={S.btnPrimary}>
            Descargar la app
          </Link>
          <Link to={AppRoutes.public.portalLogin} className="acme-btn-secondary" style={S.btnSecondary}>
            Ingresar al portal
          </Link>
        </div>
      </section>
    </div>
  );
}