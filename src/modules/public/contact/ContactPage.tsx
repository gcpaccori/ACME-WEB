export function ContactPage() {
  return (
    <section className="container">
      <div style={{ padding: '40px 0' }}>
        <h1>Contacto</h1>
        <p style={{ maxWidth: '720px', color: '#4b5563', lineHeight: 1.8 }}>
          Si deseas que tu local se integre al portal de ACME, escríbenos y te contactaremos para configurar tu negocio.
        </p>
        <div style={{ marginTop: '28px', display: 'grid', gap: '12px', maxWidth: '500px' }}>
          <div style={{ padding: '18px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#ffffff' }}>
            <strong>Email:</strong> soporte@acme.com
          </div>
          <div style={{ padding: '18px', border: '1px solid #e5e7eb', borderRadius: '16px', background: '#ffffff' }}>
            <strong>Teléfono:</strong> +54 9 11 0000-0000
          </div>
        </div>
      </div>
    </section>
  );
}
