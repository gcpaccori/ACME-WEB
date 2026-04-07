import { useContext, useEffect, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { branchService } from '../../../core/services/branchService';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function BranchStatusPage() {
  const portal = useContext(PortalContext);
  const [status, setStatus] = useState<{ is_open: boolean; accepting_orders: boolean; pause_reason?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchId = portal.currentBranch?.id;

  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      setLoading(true);
      const result = await branchService.fetchBranchStatus(branchId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setStatus(result.data ?? null);
    };

    load();
  }, [branchId]);

  const updateStatus = async (payload: { is_open?: boolean; accepting_orders?: boolean; pause_reason?: string }) => {
    if (!branchId) return;
    setLoading(true);
    const result = await branchService.updateBranchStatus(branchId, payload);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setStatus(result.data?.[0] ?? status);
  };

  if (!branchId) {
    return <div>No hay sucursal seleccionada.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h1>Estado del local</h1>
        <p style={{ color: '#6b7280' }}>Controla si el local está abierto y si acepta pedidos.</p>
      </div>
      {loading && <LoadingScreen />}
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {status ? (
        <div style={{ display: 'grid', gap: '18px' }}>
          <div style={{ padding: '22px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '12px' }}>Apertura del local</div>
            <button style={{ padding: '10px 16px' }} onClick={() => updateStatus({ is_open: !status.is_open })}>
              {status.is_open ? 'Cerrar local' : 'Abrir local'}
            </button>
            <div style={{ marginTop: '12px', color: '#6b7280' }}>
              {status.is_open ? 'Local abierto' : 'Local cerrado'}
            </div>
          </div>
          <div style={{ padding: '22px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '12px' }}>Recepción de pedidos</div>
            <button style={{ padding: '10px 16px' }} onClick={() => updateStatus({ accepting_orders: !status.accepting_orders })}>
              {status.accepting_orders ? 'Pausar recepción' : 'Activar recepción'}
            </button>
            <div style={{ marginTop: '12px', color: '#6b7280' }}>
              {status.accepting_orders ? 'Recibiendo pedidos' : 'Recepción en pausa'}
            </div>
          </div>
          <div style={{ padding: '22px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <label style={{ display: 'grid', gap: '10px' }}>
              Motivo de pausa
              <textarea
                value={status.pause_reason || ''}
                onChange={(event) => setStatus({ ...status, pause_reason: event.target.value })}
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db' }}
              />
            </label>
            <button style={{ padding: '10px 16px', marginTop: '12px' }} onClick={() => updateStatus({ pause_reason: status.pause_reason })}>
              Guardar razón
            </button>
          </div>
        </div>
      ) : (
        <div>No se encontró estado para esta sucursal.</div>
      )}
    </div>
  );
}
