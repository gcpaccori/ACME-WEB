export function ContactPage() {
  const orange = "#ff6200";
  const orangeDark = "#cc4e00";
  const purple = "#4d148c";
  const purpleDark = "#3a0f6b";

  // Icon components
  const emailIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={orangeDark} strokeWidth="1.5">
      <rect x="2" y="4" width="16" height="12" rx="2"/>
      <path d="m2 6 8 5 8-5"/>
    </svg>
  );

  const phoneIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={purpleDark} strokeWidth="1.5">
      <rect x="5" y="2" width="10" height="16" rx="2"/>
      <path d="M8 2v16M12 2v16"/>
      <circle cx="10" cy="16" r="1"/>
    </svg>
  );

  const locationIcon = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={orangeDark} strokeWidth="1.5">
      <path d="M10 2c-3.3 0-6 2.7-6 6 0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z"/>
      <circle cx="10" cy="8" r="2"/>
    </svg>
  );

  return (
    <section style={{ fontFamily: "'DM Sans', sans-serif", padding: "3rem 2rem 4rem", maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        .acme-input { width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 14px; font-family: 'DM Sans', sans-serif; border: 0.5px solid #e5e7eb; border-radius: 8px; background: #fff; color: #111; outline: none; transition: border-color 0.15s; }
        .acme-input:focus { border-color: #4d148c; }
        .contact-card { transition: border-color 0.2s; }
        .contact-card:hover { border-color: rgba(77,20,140,0.35); }
        .submit-btn { background: #4d148c; color: #fff; border: none; border-radius: 8px; padding: 12px 28px; font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: background 0.15s, transform 0.1s; }
        .submit-btn:hover { background: #3a0f6b; }
        .submit-btn:active { transform: scale(0.98); }
        @media (max-width: 640px) { .page-split { flex-direction: column !important; } .sidebar { width: 100% !important; } .form-row { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Eyebrow */}
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: orange, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 20, height: 1.5, background: orange }} />
        Contacto
      </p>

      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.9rem,5vw,3rem)", fontWeight: 400, lineHeight: 1.15, margin: "0 0 1rem" }}>
        Sumá tu local a{" "}
        <em style={{ fontStyle: "italic", color: purple }}>ACME Pedidos</em>
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.75, color: "#4b5563", maxWidth: 560, margin: "0 0 3rem", fontWeight: 300 }}>
        Completá el formulario y un asesor de nuestro equipo te contactará en menos de 24 hs para configurar tu negocio.
      </p>

      <div className="page-split" style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>

        {/* Formulario */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "2rem", display: "flex", flexDirection: "column", gap: 20 }}>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre del local</label>
                <input className="acme-input" type="text" placeholder="La Trattoria" />
              </div>
              <div>
                <label style={labelStyle}>Rubro</label>
                <select className="acme-input">
                  <option value="">Seleccioná...</option>
                  <option>Restaurante</option>
                  <option>Cafetería</option>
                  <option>Panadería</option>
                  <option>Rotisería</option>
                  <option>Otro</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nombre del responsable</label>
                <input className="acme-input" type="text" placeholder="Martín García" />
              </div>
              <div>
                <label style={labelStyle}>Teléfono de contacto</label>
                <input className="acme-input" type="tel" placeholder="+54 9 11 0000-0000" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input className="acme-input" type="email" placeholder="martin@latrattoria.com" />
            </div>

            <div>
              <label style={labelStyle}>Dirección del local</label>
              <input className="acme-input" type="text" placeholder="Av. Corrientes 1234, CABA" />
            </div>

            <div>
              <label style={labelStyle}>¿Cómo nos conociste?</label>
              <select className="acme-input">
                <option value="">Seleccioná...</option>
                <option>Redes sociales</option>
                <option>Recomendación</option>
                <option>Google</option>
                <option>App store</option>
                <option>Otro</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Mensaje adicional (opcional)</label>
              <textarea className="acme-input" placeholder="Contanos más sobre tu negocio..." style={{ minHeight: 100, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                Al enviar aceptás nuestros{" "}
                <a href="#" style={{ color: purple, textDecoration: "none" }}>términos de uso</a>.
              </p>
              <button className="submit-btn">Enviar consulta →</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 14, width: 260, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", margin: "0 0 4px" }}>Canales directos</p>

          {[
            { icon: emailIcon, bg: "#fff0e6", accentColor: orangeDark, label: "Email", value: "soporte@acme.com", sub: "Respuesta en menos de 24 hs" },
            { icon: phoneIcon, bg: "#ede0f7", accentColor: purpleDark, label: "Teléfono / WhatsApp", value: "+54 9 11 0000-0000", sub: "Lun–Vie de 9 a 18 hs" },
            { icon: locationIcon, bg: "#fff0e6", accentColor: orangeDark, label: "Oficina central", value: "Av. del Libertador 1000", sub: "Buenos Aires, Argentina" },
          ].map((item, index) => (
            <div key={index} className="contact-card" style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "1.25rem 1rem", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: item.accentColor, margin: "0 0 3px" }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{item.value}</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{item.sub}</p>
              </div>
            </div>
          ))}

          <hr style={{ border: "none", borderTop: "0.5px solid #e5e7eb", margin: "4px 0" }} />

          {/* Tiempos */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "1.25rem" }}>
            <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 10px" }}>Tiempo de activación</p>
            {[["Consulta inicial", "24 hs", orange], ["Configuración", "48 hs", orange], ["Local activo", "72 hs", purple]].map(([step, time, color]) => (
              <div key={step} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{step}</span>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: color === purple ? "#ede0f7" : "#fff0e6", color }}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 500 as const, color: "#6b7280", marginBottom: 6, letterSpacing: "0.04em" };