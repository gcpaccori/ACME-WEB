export function AboutPage() {
  return (
    <section className="container">
      <div style={{ padding: '40px 0' }}>
        <h1>Cómo funciona ACME Web</h1>
        <p style={{ maxWidth: '720px', color: '#4b5563', lineHeight: 1.8 }}>
          La plataforma ofrece una landing pública para captar comercios y un portal privado para cada local.
          El portal permite recibir y gestionar pedidos, controlar el menú, horarios y el estado operativo.
        </p>
        <div style={{ display: 'grid', gap: '18px', marginTop: '28px' }}>
          <div style={{ padding: '22px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#ffffff' }}>
            <h2>Zona pública</h2>
            <p style={{ color: '#475569' }}>Presentación de beneficios, enlaces para descargar las apps y captación de comercios.</p>
          </div>
          <div style={{ padding: '22px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#ffffff' }}>
            <h2>Zona privada</h2>
            <p style={{ color: '#475569' }}>Portal por local para ver pedidos, menú, horarios y estado del local.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
