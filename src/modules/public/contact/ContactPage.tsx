import './ContactPage.css';

// ── ICONS ────────────────────────────────────────────────────────────────────

function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ── WAVE ────────────────────────────────────────────────────────────────────

function HeroWave() {
  return (
    <div style={{ background: '#2d0a6b', lineHeight: 0, fontSize: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 1440 70" preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: 60, verticalAlign: 'bottom' }}>
        <path d="M0,35 C180,70 360,0 540,35 C720,70 900,0 1080,35 C1260,70 1380,15 1440,35 L1440,90 L0,90 Z" fill="#f8f9fa" />
      </svg>
    </div>
  );
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function ContactPage() {
  return (
    <div className="contact-page">

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="contact-hero__text">
          <div className="contact-hero__eyebrow">
            <div className="contact-hero__eyebrow-dot" />
            Ponerse en contacto
          </div>
          <h1>
            Hagamos crecer tu negocio <span>juntos</span>
          </h1>
          <p className="contact-hero__lead">
            Nuestro equipo está listo para ayudarte a integrar tu local en ACME Pedidos. Completa el formulario y un asesor te contactará en menos de 24 horas.
          </p>
        </div>

        <div className="contact-hero__chips">
          <div className="contact-chip">
            <div className="contact-chip__icon"><IconMail /></div>
            <div>
              <span className="contact-chip__label">Email</span>
              <span className="contact-chip__value">soporte@acme.pe</span>
            </div>
          </div>
          <div className="contact-chip">
            <div className="contact-chip__icon"><IconPhone /></div>
            <div>
              <span className="contact-chip__label">WhatsApp</span>
              <span className="contact-chip__value">+51 967 000 000</span>
            </div>
          </div>
          <div className="contact-chip">
            <div className="contact-chip__icon contact-chip__icon--purple"><IconClock /></div>
            <div>
              <span className="contact-chip__label">Horario asesoría</span>
              <span className="contact-chip__value">Lun–Sáb 9:00–18:00</span>
            </div>
          </div>
        </div>
      </section>

      <HeroWave />

      {/* ── BODY ── */}
      <div className="contact-body">
        <div className="contact-grid">

          {/* ── FORM ── */}
          <div className="contact-form-card">
            <h2 className="contact-form-card__title">Registra tu negocio en ACME</h2>
            <p className="contact-form-card__subtitle">
              Completa los datos y nuestro equipo se pondrá en contacto contigo para iniciar la configuración de tu local.
            </p>

            <form className="contact-form" onSubmit={e => e.preventDefault()}>
              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label className="contact-form-label">Nombre del local *</label>
                  <input className="contact-form-input" type="text" placeholder="Ej: Restaurante El Huancaíno" required />
                </div>
                <div className="contact-form-field">
                  <label className="contact-form-label">Rubro *</label>
                  <select className="contact-form-select" required>
                    <option value="">Selecciona un rubro...</option>
                    <option>Restaurante</option>
                    <option>Cafetería / Café</option>
                    <option>Panadería / Pastelería</option>
                    <option>Pollería</option>
                    <option>Rotisería</option>
                    <option>Comida rápida</option>
                    <option>Farmacia</option>
                    <option>Tienda / Minimarket</option>
                    <option>Otro</option>
                  </select>
                </div>
              </div>

              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label className="contact-form-label">Nombre del responsable *</label>
                  <input className="contact-form-input" type="text" placeholder="Tu nombre completo" required />
                </div>
                <div className="contact-form-field">
                  <label className="contact-form-label">Teléfono de contacto *</label>
                  <input className="contact-form-input" type="tel" placeholder="+51 9XX XXX XXX" required />
                </div>
              </div>

              <div className="contact-form-field">
                <label className="contact-form-label">Correo electrónico *</label>
                <input className="contact-form-input" type="email" placeholder="tucorreo@ejemplo.com" required />
              </div>

              <div className="contact-form-field">
                <label className="contact-form-label">Dirección del local *</label>
                <input className="contact-form-input" type="text" placeholder="Calle, número, distrito — Huancavelica" required />
              </div>

              <div className="contact-form-row">
                <div className="contact-form-field">
                  <label className="contact-form-label">¿Cuántos pedidos al día estimas?</label>
                  <select className="contact-form-select">
                    <option value="">Selecciona...</option>
                    <option>Menos de 10</option>
                    <option>10 – 30</option>
                    <option>30 – 60</option>
                    <option>Más de 60</option>
                  </select>
                </div>
                <div className="contact-form-field">
                  <label className="contact-form-label">¿Cómo nos conociste?</label>
                  <select className="contact-form-select">
                    <option value="">Selecciona...</option>
                    <option>Redes sociales</option>
                    <option>Recomendación de otro local</option>
                    <option>Google / Buscador</option>
                    <option>App Store / Play Store</option>
                    <option>Otro</option>
                  </select>
                </div>
              </div>

              <div className="contact-form-field">
                <label className="contact-form-label">Mensaje adicional (opcional)</label>
                <textarea className="contact-form-textarea" placeholder="Cuéntanos más sobre tu negocio, horario de atención, o cualquier detalle que nos ayude a preparar tu integración..." />
              </div>

              <div className="contact-form-footer">
                <p className="contact-form-terms">
                  Al enviar aceptas nuestros <a href="#">términos de uso</a> y <a href="#">política de privacidad</a>.
                </p>
                <button type="submit" className="contact-submit-btn">
                  <IconSend />
                  Enviar solicitud
                </button>
              </div>
            </form>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="contact-sidebar">

            {/* Contact channels */}
            <div className="contact-sidebar-card">
              <span className="contact-sidebar-card__label">Canales de contacto</span>
              <div className="contact-info-items">
                <div className="contact-info-item">
                  <div className="contact-info-item__icon contact-info-item__icon--orange"><IconMail /></div>
                  <div>
                    <span className="contact-info-item__label">Email</span>
                    <span className="contact-info-item__value">soporte@acme.pe</span>
                    <span className="contact-info-item__sub">Respuesta en menos de 24 h</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-item__icon contact-info-item__icon--purple"><IconPhone /></div>
                  <div>
                    <span className="contact-info-item__label">WhatsApp / Llamada</span>
                    <span className="contact-info-item__value">+51 967 000 000</span>
                    <span className="contact-info-item__sub">Lun–Sáb de 9:00 a 18:00</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-item__icon contact-info-item__icon--orange"><IconMapPin /></div>
                  <div>
                    <span className="contact-info-item__label">Ubicación</span>
                    <span className="contact-info-item__value">Huancavelica, Perú</span>
                    <span className="contact-info-item__sub">Atención presencial con cita previa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activation timeline */}
            <div className="contact-sidebar-card">
              <span className="contact-sidebar-card__label">Proceso de activación</span>
              <div className="contact-timeline">
                <div className="contact-timeline-step">
                  <div className="contact-timeline-step__dot contact-timeline-step__dot--orange">1</div>
                  <div className="contact-timeline-step__content">
                    <span className="contact-timeline-step__name">Consulta inicial</span>
                    <span className="contact-timeline-step__desc">Recibimos tu solicitud</span>
                  </div>
                  <span className="contact-timeline-step__badge contact-timeline-step__badge--orange">24 h</span>
                </div>
                <div className="contact-timeline-step">
                  <div className="contact-timeline-step__dot contact-timeline-step__dot--orange">2</div>
                  <div className="contact-timeline-step__content">
                    <span className="contact-timeline-step__name">Configuración</span>
                    <span className="contact-timeline-step__desc">Cargamos tu menú y datos</span>
                  </div>
                  <span className="contact-timeline-step__badge contact-timeline-step__badge--orange">48 h</span>
                </div>
                <div className="contact-timeline-step">
                  <div className="contact-timeline-step__dot contact-timeline-step__dot--purple">3</div>
                  <div className="contact-timeline-step__content">
                    <span className="contact-timeline-step__name">¡Local activo!</span>
                    <span className="contact-timeline-step__desc">Empiezas a recibir pedidos</span>
                  </div>
                  <span className="contact-timeline-step__badge contact-timeline-step__badge--purple">72 h</span>
                </div>
              </div>
            </div>

            {/* Social networks */}
            <div className="contact-sidebar-card">
              <span className="contact-sidebar-card__label">Síguenos en redes</span>
              <div className="contact-socials">
                <a href="#" className="contact-social-link contact-social-link--whatsapp">
                  <IconWhatsApp /> WhatsApp
                </a>
                <a href="#" className="contact-social-link contact-social-link--instagram">
                  <IconInstagram /> Instagram
                </a>
                <a href="#" className="contact-social-link contact-social-link--facebook">
                  <IconFacebook /> Facebook
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}