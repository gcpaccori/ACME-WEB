import { useContext, useEffect, useState } from 'react';
import { PortalContext } from '../../../modules/auth/session/PortalContext';
import { staffService } from '../../../core/services/staffService';
import { StaffMember } from '../../../core/types';
import { LoadingScreen } from '../../../components/shared/LoadingScreen';

export function StaffPage() {
  const portal = useContext(PortalContext);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantId = portal.merchant?.id;

  useEffect(() => {
    const load = async () => {
      if (!merchantId) return;
      setLoading(true);
      const result = await staffService.fetchStaffForMerchant(merchantId);
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setStaff(result.data ?? []);
    };

    load();
  }, [merchantId]);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h1>Personal</h1>
        <p style={{ color: '#6b7280' }}>Listado de empleados y roles asociados al local.</p>
      </div>
      {loading ? (
        <LoadingScreen />
      ) : error ? (
        <div style={{ color: '#b91c1c' }}>{error}</div>
      ) : staff.length === 0 ? (
        <div>No hay personal registrado para este comercio.</div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {staff.map((member) => (
            <div key={member.id} style={{ padding: '18px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700 }}>{member.full_name || member.email || 'Sin nombre'}</div>
              <div style={{ color: '#6b7280', marginTop: '8px' }}>Rol: {member.role}</div>
              <div style={{ marginTop: '8px' }}>Sucursales: {(member.branch_ids || []).join(', ') || 'No asignadas'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
