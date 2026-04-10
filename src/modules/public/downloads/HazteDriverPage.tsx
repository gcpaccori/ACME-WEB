export function HazteDriverPage() {
  const orange = "#ff6200";
  const purple = "#4d148c";
  const orangeDark = "#cc4e00";
  const purpleDark = "#3a0f6b";

  return (
    <section style={{ fontFamily: "'DM Sans', sans-serif", padding: "3rem 2rem 4rem", maxWidth: 860, margin: "0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');`}</style>

      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: orange, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 20, height: 1.5, background: orange }} />
        HAZTE DRIVER
      </p>

      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 400, lineHeight: 1.15, margin: "0 0 1.5rem" }}>
        Conviértete en{" "}
        <em style={{ fontStyle: "italic", color: purple }}>Repartidor</em>
      </h1>

      <p style={{ fontSize: 17, lineHeight: 1.75, color: "#4b5563", maxWidth: 600, margin: "0 0 3rem", fontWeight: 300 }}>
        Únete a la red de repartidores más grande de Huancavelica. Gana dinero entregando pedidos desde tu mototaxi.
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "3rem", flexWrap: "wrap", alignItems: "center" }}>
        { [["S/", "ingue tu propio horario"], ["0%", "comisiones por entrega"], ["∞", "pedidos disponibles"]].map(([n, l], i) => (
          <>
            {i > 0 && <div key={`s${i}`} style={{ width: 0.5, background: "#e5e7eb", alignSelf: "stretch" }} />}
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2rem", fontWeight: 400, lineHeight: 1, color: orange }}>{n}</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 300 }}>{l}</span>
            </div>
          </>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "0.5px solid #e5e7eb", marginBottom: "3rem" }} />

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "1.5rem" }}>
        {/* App */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "1.75rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: orange }} />
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff0e6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={orangeDark} strokeWidth="1.5"><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2c-2.5 3-4 5-4 8s1.5 5 4 8M10 2c2.5 3 4 5 4 8s-1.5 5-4 8"/></svg>
          </div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: orangeDark, margin: "0 0 6px" }}>Descarga gratuita</p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", fontWeight: 400, margin: "0 0 0.75rem" }}>App HAZTE DRIVER</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4b5563", margin: "0 0 1.25rem" }}>Descarga la aplicación para empezar a recibir pedidos al instante.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {["Recibe notificaciones de pedidos", "Navegación GPS integrada", "Gestiona tus entregas", "Estadísticas en tiempo real"].map(item => (
              <li key={item} style={{ fontSize: 13, color: "#4b5563", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: orange, flexShrink: 0 }} />{item}
              </li>
            ))}
          </ul>
        </div>

        {/* Requisitos */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "1.75rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: purple }} />
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ede0f7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke={purpleDark} strokeWidth="1.5"><rect x="3" y="9" width="14" height="9" rx="2"/><path d="M6 9V6a4 4 0 1 1 8 0v3"/></svg>
          </div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: purpleDark, margin: "0 0 6px" }}>Requisitos</p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", fontWeight: 400, margin: "0 0 0.75rem" }}>Para empezar</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#4b5563", margin: "0 0 1.25rem" }}>Necesitas cumplir con los siguientes requisitos para unirte a nuestra red de repartidores.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {["Tener mototaxi propio", "Licencia de conducir vigente", "Smartphone con Android/iOS", "Ser mayor de 18 años"].map(item => (
              <li key={item} style={{ fontSize: 13, color: "#4b5563", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: purple, flexShrink: 0 }} />{item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <button style={{
          background: orange,
          color: "#fff",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: "1rem",
          padding: "14px 32px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(255,98,0,.3)",
          transition: "all 0.2s ease"
        }}>
          Descargar App
        </button>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: "1rem" }}>
          Disponible para Android e iOS
        </p>
      </div>
    </section>
  );
}
