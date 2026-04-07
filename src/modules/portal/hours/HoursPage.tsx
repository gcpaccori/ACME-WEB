import { useContext, useEffect, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { branchService } from '../../../core/services/branchService';
import { BranchHour } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function HoursPage() {
  const portal = useContext(PortalContext);
  const [hours, setHours] = useState<BranchHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchId = portal.currentBranch?.id;

  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      setLoading(true);
      const result = await branchService.fetchBranchHours(branchId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setHours(result.data ?? []);
    };

    load();
  }, [branchId]);

  const updateHour = async (hourId: string, payload: Partial<BranchHour>) => {
    setLoading(true);
    const result = await branchService.updateBranchHour(hourId, payload);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setHours((current) => current.map((hour) => (hour.id === hourId ? { ...hour, ...payload } : hour)));
  };

  if (!branchId) {
    return <div>No hay sucursal seleccionada.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h1>Horarios</h1>
        <p style={{ color: '#6b7280' }}>Gestiona los horarios básicos de apertura y cierre.</p>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : hours.length === 0 ? (
        <div>No hay horarios definidos para esta sucursal.</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {hours.map((hour) => (
            <div key={hour.id} style={{ padding: '18px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ fontWeight: 700 }}>Día {hour.weekday}</div>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    Apertura
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(event) => updateHour(hour.id, { open_time: event.target.value })}
                      style={{ padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '8px' }}>
                    Cierre
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(event) => updateHour(hour.id, { close_time: event.target.value })}
                      style={{ padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
