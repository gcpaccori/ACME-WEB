export function DownloadsPage() {
  return (
    <section className="container">
      <div style={{ padding: '40px 0' }}>
        <h1>Descargar</h1>
        <p style={{ maxWidth: '720px', color: '#4b5563', lineHeight: 1.8 }}>
          En esta etapa, la landing muestra los accesos para descargar las apps de cliente y driver. Luego puedes reemplazarlos con enlaces reales.
        </p>
        <div style={{ display: 'grid', gap: '16px', marginTop: '24px', maxWidth: '520px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
            <strong>App Cliente</strong>
            <p style={{ color: '#475569', margin: '8px 0 0' }}>Próximamente disponible para iOS y Android.</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
            <strong>App Driver</strong>
            <p style={{ color: '#475569', margin: '8px 0 0' }}>Próximamente disponible para repartidores.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
