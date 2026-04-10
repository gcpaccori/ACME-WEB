import './HazteDriverPage.css';
import driverHeroImg from '../../../images/driver_hero.png';
import driverMockupImg from '../../../images/driver_mockup.png';

// ── ICON COMPONENTS ──────────────────────────────────────────────────────────

function IconEarnings() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <path d="M7 15h.01M11 15h.01" />
    </svg>
  );
}

function IconFlexibility() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconSupport() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2H4.18A2 2 0 0 1 2 19.92v-3" />
      <path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ── WAVE DIVIDER ─────────────────────────────────────────────────────────────
// Must be placed BETWEEN sections (not inside), as a standalone element.
// fromColor: background color of the preceding section.
// toColor:   background color of the following section (SVG fill).
// flip:      mirrors horizontally for visual variety.
function SectionWave({
  fromColor,
  toColor,
  flip = false,
}: {
  fromColor: string;
  toColor: string;
  flip?: boolean;
}) {
  return (
    <div
      style={{
        display: 'block',
        background: fromColor,
        lineHeight: 0,
        overflow: 'hidden',
        width: '100%',
        fontSize: 0,
      }}
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{
          display: 'block',
          width: '100%',
          height: 70,
          transform: flip ? 'scaleX(-1)' : 'none',
          verticalAlign: 'bottom',
        }}
      >
        {/* Path closes at y=100 (beyond the 80 viewBox) so the fill
            completely covers the bottom edge — eliminates sub-pixel lines */}
        <path
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,100 L0,100 Z"
          fill={toColor}
        />
      </svg>
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────

export function HazteDriverPage() {
  return (
    <div className="driver-page">

      {/* ── HERO ── */}
      <section className="driver-hero">
        <div className="driver-hero__content animate-fade-in">
          <div className="driver-hero__eyebrow">
            <span className="eyebrow-dot" />
            Oportunidad en Huancavelica
          </div>
          <h1 className="driver-hero__title">
            Gana dinero a tu ritmo,<br />
            <span>sé tu propio jefe</span>
          </h1>
          <p className="driver-hero__description">
            Únete a la red de repartidores de ACME Pedidos. Genera ingresos extra entregando pedidos en toda la ciudad. ¡Tú decides cuándo y cuánto trabajar!
          </p>
          <div className="store-buttons">
            <a href="#" className="store-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 20.5v-17c0-.83 1-1.3 1.7-.8l14 8.5c.7.4.7 1.5 0 1.9l-14 8.5c-.7.5-1.7.03-1.7-.8z" /></svg>
              <span><span className="small">Descargar en</span><span className="big">Google Play</span></span>
            </a>
            <a href="#" className="store-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
              <span><span className="small">Consíguelo en el</span><span className="big">App Store</span></span>
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span className="hero-stat__num">+500</span><span className="hero-stat__label">Entregas/mes</span></div>
            <div className="hero-stat__divider" />
            <div className="hero-stat"><span className="hero-stat__num">4.9</span><span className="hero-stat__label">Valoración</span></div>
            <div className="hero-stat__divider" />
            <div className="hero-stat"><span className="hero-stat__num">24h</span><span className="hero-stat__label">Activación</span></div>
          </div>
        </div>
        <div className="driver-hero__image">
          <img src={driverHeroImg} alt="Driver en Huancavelica" />
        </div>
      </section>

      {/* ── WAVE: white → gray ── */}
      <SectionWave fromColor="#ffffff" toColor="#f8f9fa" />

      {/* ── BENEFITS ── */}
      <section className="driver-benefits">
        <h2 className="section-title">¿Por qué conducir con nosotros?</h2>
        <p className="section-subtitle">Huancavelica confía en ACME, y nuestros conductores son el corazón de esta gran familia.</p>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon"><IconEarnings /></div>
            <h3>Ganancias Reales</h3>
            <p>Sácale provecho a tus horas libres. Recibe tus pagos de forma puntual y sin comisiones ocultas.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon"><IconFlexibility /></div>
            <h3>Flexibilidad Total</h3>
            <p>Tú eliges cuándo conectarte. Sin turnos forzados ni jefes, trabaja a tu propio ritmo.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon"><IconSupport /></div>
            <h3>Soporte 24/7</h3>
            <p>No estás solo. Nuestro equipo de soporte está listo para ayudarte en cada entrega.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon"><IconMap /></div>
            <h3>GPS Integrado</h3>
            <p>Navega sin estrés. La app te guía con rutas optimizadas para cada pedido en la ciudad.</p>
          </div>
        </div>
      </section>

      {/* ── WAVE: gray → purple ── */}
      <SectionWave fromColor="#f8f9fa" toColor="#4d148c" flip />

      {/* ── MOTORIZED ── */}
      <section className="motorized-section">
        <div className="motorized-inner">
          <div className="motorized-badge">ACTUALIZACIÓN 2024</div>
          <h2 className="section-title">Solo Unidades Motorizadas</h2>
          <p className="motorized-desc">
            Para garantizar la rapidez que nos caracteriza en Huancavelica, actualmente solo aceptamos nuevos registros de conductores con <strong>moto o mototaxi</strong>.
          </p>
          <div className="moto-pills">
            <span className="moto-pill">🏍 Moto lineal</span>
            <span className="moto-pill">🛺 Mototaxi</span>
          </div>
          <div className="moto-info-grid">
            <div className="moto-info-card">
              <div className="moto-info-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h4>Sin experiencia previa</h4>
              <p>No necesitas haber trabajado en delivery antes. Te guiamos desde el primer día.</p>
            </div>
            <div className="moto-info-card">
              <div className="moto-info-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>Horario libre</h4>
              <p>Conecta cuando quieras, mañana, tarde o noche. Tú tienes el control total.</p>
            </div>
            <div className="moto-info-card">
              <div className="moto-info-card__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <h4>Pagos semanales</h4>
              <p>Cobra tus ganancias cada semana directamente en tu cuenta bancaria o billetera digital.</p>
            </div>
          </div>
          <div className="moto-testimonial">
            <div className="moto-testimonial__stars">
              {[1,2,3,4,5].map(i => <span key={i} className="moto-star"><IconStar /></span>)}
            </div>
            <p className="moto-testimonial__text">"Llevo 6 meses con ACME y ya aumenté mis ingresos en un 40%. La app es muy sencilla y el soporte siempre responde rápido."</p>
            <span className="moto-testimonial__author">— Carlos M., Driver desde Huancavelica</span>
          </div>
        </div>
      </section>

      {/* ── WAVE: purple → white ── */}
      <SectionWave fromColor="#4d148c" toColor="#ffffff" />

      {/* ── APP DOWNLOAD ── */}
      <section className="driver-download">
        <div className="download-image animate-fade-in">
          <img src={driverMockupImg} alt="App Interface Mockup" />
        </div>
        <div className="download-content">
          <h2 className="section-title">Todo en la palma de tu mano</h2>
          <p className="download-desc">
            Nuestra aplicación para drivers es intuitiva y potente. GPS integrado, historial de ganancias, y alertas en tiempo real para que nunca pierdas una oportunidad.
          </p>
          <ul className="app-features-list">
            <li><i><IconCheck /></i> Mapa con rutas optimizadas</li>
            <li><i><IconCheck /></i> Historial detallado de ganancias</li>
            <li><i><IconCheck /></i> Notificaciones de pedidos en tiempo real</li>
            <li><i><IconCheck /></i> Chat de soporte integrado</li>
          </ul>
          <div className="store-buttons">
            <a href="#" className="store-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 20.5v-17c0-.83 1-1.3 1.7-.8l14 8.5c.7.4.7 1.5 0 1.9l-14 8.5c-.7.5-1.7.03-1.7-.8z" /></svg>
              <span><span className="small">Descargar para</span><span className="big">Android</span></span>
            </a>
            <a href="#" className="store-button">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
              <span><span className="small">Disponible para</span><span className="big">iOS / iPhone</span></span>
            </a>
          </div>
        </div>
      </section>

      {/* ── WAVE: white → gray ── */}
      <SectionWave fromColor="#ffffff" toColor="#f8f9fa" flip />

      {/* ── STEPS ── */}
      <section className="steps-section">
        <h2 className="section-title">Comienza en 4 pasos</h2>
        <p className="section-subtitle">El proceso de registro es simple y se completa en menos de 10 minutos.</p>
        <div className="steps-grid">
          <div className="step-item">
            <h4>Descarga la App</h4>
            <p>Baja 'ACME Driver' desde Google Play o App Store, disponible gratis.</p>
          </div>
          <div className="step-item">
            <h4>Crea tu cuenta</h4>
            <p>Regístrate con tu correo, sube tu foto de perfil y verifica tu número.</p>
          </div>
          <div className="step-item">
            <h4>Sube documentos</h4>
            <p>Adjunta tu DNI, Brevete vigente y SOAT. El proceso es 100% digital.</p>
          </div>
          <div className="step-item">
            <h4>¡Comienza a ganar!</h4>
            <p>Tras la validación en 24h, actívate y recibe pedidos al instante.</p>
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section className="requirements-section">
        <div className="requirements-container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>¿Qué necesitas para unirte?</h2>
          <p style={{ textAlign: 'center', color: 'var(--driver-text-muted)', marginBottom: '36px', fontSize: '0.98rem' }}>
            Cumples los requisitos en minutos. Aquí el detalle completo:
          </p>
          <div className="requirement-list">
            <div className="requirement-item"><i><IconCheck /></i> Ser mayor de 18 años</div>
            <div className="requirement-item"><i><IconCheck /></i> Smartphone Android 6+ o iOS 13+</div>
            <div className="requirement-item"><i><IconCheck /></i> Moto lineal o Mototaxi propio</div>
            <div className="requirement-item"><i><IconCheck /></i> Brevete A-I o superior vigente</div>
            <div className="requirement-item"><i><IconCheck /></i> SOAT activo y vigente</div>
            <div className="requirement-item"><i><IconCheck /></i> DNI o carnet de extranjería</div>
          </div>
        </div>
      </section>

    </div>
  );
}