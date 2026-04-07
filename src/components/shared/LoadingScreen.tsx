export function LoadingScreen({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', marginBottom: '12px' }}>{message}</div>
      <div style={{ color: '#6b7280' }}>Por favor espera un momento.</div>
    </div>
  );
}
