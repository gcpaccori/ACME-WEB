import { Link } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import mochilaImg from '../../../images/mochila.png';
import brasaImg from '../../../images/brasa.png';
import celImg from '../../../images/cel.png';
import mapaHvcaImg from '../../../images/mapa-hvca.png';
import superiorSvg from '../../../images/superior.svg';

// ─── Inline styles as constants to keep the component clean ───────────────────

const S = {
  // Hero
  hero: {
    minHeight: '88vh',
    background: '#ffffff',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    padding: '120px 80px 60px',
    position: 'relative' as const,
    overflow: 'hidden',
    gap: '48px',
  } as React.CSSProperties,
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(77, 20, 140, 0.1)',
    border: '1px solid rgba(77, 20, 140, 0.3)',
    color: '#4d148c',
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
    color: '#1a0a2e',
    marginBottom: '20px',
  } as React.CSSProperties,
  heroSub: {
    color: '#5b4b78',
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
    background: 'transparent',
    color: '#4d148c',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '1rem',
    padding: '14px 30px',
    borderRadius: '14px',
    border: '2px solid #4d148c',
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
        @keyframes acme-scroll { 0%{transform: translateX(0)} 100%{transform: translateX(-50%)} }
        .acme-pulse { animation: acme-pulse 2s infinite; }
        .acme-float { animation: acme-float 3s ease-in-out infinite; }
        .acme-float-delay { animation: acme-float 3s ease-in-out .5s infinite; }
        .acme-cat-card { transition: transform .25s, box-shadow .25s; }
        .acme-cat-card:hover { transform: translateY(-6px); }
        .acme-feat-card { transition: border-color .2s, transform .2s, box-shadow .2s; }
        .acme-feat-card:hover { border-color: #4d148c !important; transform: translateY(-4px); box-shadow: 0 16px 40px rgba(77,20,140,.12) !important; }
        .acme-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,98,0,.5) !important; }
        .acme-btn-secondary:hover { background: rgba(77,20,140,.1) !important; }
        .acme-nav-link:hover { background: #f0e8ff; color: #4d148c !important; }
        .acme-brands-scroll { 
          display: flex; 
          animation: acme-scroll 60s linear infinite;
          width: fit-content;
        }
        .acme-brands-container {
          overflow: hidden;
          white-space: nowrap;
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={S.hero}>
        {/* decorative circles */}
        <img
          src={superiorSvg}
          alt=""
          style={{
            position: 'absolute',
            left: '-150px',
            top: '-150px',
            width: '1000px',
            height: '820px',
            pointerEvents: 'none',
            transform: 'scaleX(-1)',
            opacity: 0.9,
          }}
        />

        {/* Left: SVG with images */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <svg width="500" height="500" viewBox="0 0 500 500" style={{ overflow: 'visible' }}>
            {/* Images */}
            <image
              href={mochilaImg}
              x="50"
              y="120"
              width="300"
              height="300"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
            />
            <image
              href={brasaImg}
              x="300"
              y="260"
              width="160"
              height="160"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
            />
            <image
              href={celImg}
              x="-100"
              y="190"
              width="240"
              height="240"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
            />
          </svg>
        </div>

        {/* Right: text */}
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
            <Link to={AppRoutes.public.hazteDriver} className="acme-btn-primary" style={S.btnPrimary}>
              HAZTE DRIVER
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
      </section>

      {/* ---- BRANDS ---- */}
      <div style={{ background: '#f5f5f8', padding: '36px 0', textAlign: 'center' }}>
        <p style={{ color: '#5b4b78', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: '22px' }}>
          Negocios que confían en nosotros
        </p>
        <div className="acme-brands-container">
          <div className="acme-brands-scroll">
            {[...Array(2)].flatMap(() => [
              'ARTESANO RESTAURANT', 'BROSTERIA MADEROS', 'CALDOS PICON', 'CHIFA TRENCITO MACHO', 
              'LOS FOGONES', 'POLLERIA CCARHUARRAZU', 'PONCHES DE MACA SRA VICKY', 'RESTOBAR CURAYACU', 
              'SANGUCHERIA EL CHAMO BURGUER', 'BISTECKS Y PARILLAS ADA', 'CAFÉ ZORRILLA', 'CEVICHERIA LOS DELFINES', 
              'JUGUERIA LA BAHIA DE ADA', 'PIZZA ROMA', 'POLLERIA HUANCAYOSS 1 - SANTA ANA', 'RESTOBAR BOHEMIA', 'RESTOBAR OASIS'
            ]).map((b, idx) => (
              <div key={`${b}-${idx}`} style={{
                background: '#fff', borderRadius: '12px', padding: '12px 24px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '.85rem',
                color: '#b0a0c0', border: '1px solid #ede8f7',
                marginRight: '32px',
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }}>{b}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section style={{ padding: '80px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '2.8rem', color: '#1a0a2e', marginBottom: '48px' }}>
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
          background: '#ffffff',
          borderRadius: '28px',
          padding: '20px',
          boxShadow: '0 24px 60px rgba(77,20,140,.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src={mapaHvcaImg} 
            alt="Mapa de Huancavelica" 
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '20px'
            }}
          />
        </div>
      </section>

{/* ── CTA ── */}
<section style={{
  background: '#f5f5f7',
  padding: '60px 80px',
  display: 'flex',
  justifyContent: 'center',
}}>
  <div style={{
    background: '#fff',
    borderRadius: '24px',
    padding: '48px 60px',
    display: 'flex',
    alignItems: 'center',
    gap: '60px',
    maxWidth: '960px',
    width: '100%',
    boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Left: phone mockup placeholder */}
    <div style={{ position: 'relative', flexShrink: 0, width: '220px', height: '320px' }}>
      {/* Orange blob behind phone */}
      <div style={{
        position: 'absolute',
        left: '-20px',
        top: '20px',
        width: '200px',
        height: '260px',
        background: '#ff6200',
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        zIndex: 0,
      }} />
      {/* Phone frame */}
      <div style={{
        position: 'absolute',
        left: '20px',
        top: 0,
        width: '160px',
        height: '310px',
        background: '#fff',
        borderRadius: '28px',
        border: '6px solid #e0e0e0',
        zIndex: 1,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Phone top bar */}
        <div style={{ background: '#ff6200', height: '36px', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px' }} />
          <div style={{ width: '28px', height: '14px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
        </div>
        {/* Category icons row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 6px', borderBottom: '0.5px solid #f0f0f0' }}>
          {['🍔','🍕','🌮','☕'].map((ic, i) => (
            <div key={i} style={{ width: '24px', height: '24px', background: '#fff3ec', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{ic}</div>
          ))}
        </div>
        {/* Restaurant list rows */}
        {['Bembos','China Wok','Popeyes','Coqui Café'].map((name, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderBottom: '0.5px solid #f5f5f5' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: i % 2 === 0 ? '#fff3ec' : '#ffeaea', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '7px', background: '#e8e8e8', borderRadius: '3px', marginBottom: '4px', width: '70%' }} />
              <div style={{ height: '5px', background: '#f0f0f0', borderRadius: '3px', width: '90%' }} />
            </div>
            <div style={{ fontSize: '8px', color: '#ff6200', fontWeight: 700 }}>S/4</div>
          </div>
        ))}
      </div>
    </div>

    {/* Right: content */}
    <div style={{ flex: 1 }}>
      {/* App icon */}
      <div style={{
        width: '56px', height: '56px', background: 'linear-gradient(135deg, #ff8c00, #ff6200)',
        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', fontSize: '26px',
      }}>
        🔥
      </div>

      <h2 style={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 800,
        fontSize: '2rem',
        color: '#ff6200',
        lineHeight: 1.2,
        margin: '0 0 28px',
      }}>
        Descarga la app y únete a las más<br />de 800,000 personas que usan<br />Acme Pedidos hoy
      </h2>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          to={AppRoutes.public.hazteDriver}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#111', color: '#fff', padding: '12px 20px',
            borderRadius: '12px', textDecoration: 'none', minWidth: '160px',
          }}
        >
          <span style={{ fontSize: '22px' }}>▶</span>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'sans-serif' }}>Disponible en</div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'sans-serif' }}>Google Play</div>
          </div>
        </Link>
        <Link
          to={AppRoutes.public.hazteDriver}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#111', color: '#fff', padding: '12px 20px',
            borderRadius: '12px', textDecoration: 'none', minWidth: '160px',
          }}
        >
          <span style={{ fontSize: '22px' }}></span>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'sans-serif' }}>Disponible en</div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'sans-serif' }}>App Store</div>
          </div>
        </Link>
      </div>
    </div>
  </div>
</section>
    </div>
  );
}