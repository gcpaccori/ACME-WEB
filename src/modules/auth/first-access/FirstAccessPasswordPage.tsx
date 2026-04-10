import { FormEvent, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard, StatusPill } from '../../../components/admin/AdminScaffold';
import { TextField } from '../../../components/ui/TextField';
import { AppRoutes } from '../../../core/constants/routes';
import { merchantAccessService } from '../../../core/services/merchantAccessService';
import { PortalContext } from '../session/PortalContext';

export function FirstAccessPasswordPage() {
  const portal = useContext(PortalContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordError = useMemo(() => {
    if (!password) return '';
    if (password.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
    return '';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return '';
    if (confirmPassword !== password) return 'Las contraseñas no coinciden.';
    return '';
  }, [confirmPassword, password]);

  const canSubmit = password.length >= 8 && confirmPassword === password && !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await merchantAccessService.completeFirstAccess(password);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Contraseña actualizada. Redirigiendo al portal...');
    await portal.reloadPortalContext();
    navigate(AppRoutes.portal.dashboard, { replace: true });
  };

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <SectionCard
        title="Primer acceso del negocio"
        description="La plataforma te entrego una contraseña temporal. Antes de operar el negocio, debes definir una nueva contraseña privada."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <StatusPill label={portal.accessControl?.email || portal.profile?.email || 'Sin correo'} tone="info" />
          <StatusPill label={portal.accessControl?.onboarding_status || 'active'} tone="warning" />
          <StatusPill label="Cambio obligatorio" tone="danger" />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Nueva contraseña</span>
            <TextField type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 8 caracteres" />
            {passwordError ? <span style={{ fontSize: '12px', color: '#b91c1c' }}>{passwordError}</span> : null}
          </label>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Confirmar contraseña</span>
            <TextField type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repite la contraseña" />
            {confirmError ? <span style={{ fontSize: '12px', color: '#b91c1c' }}>{confirmError}</span> : null}
          </label>

          {error ? (
            <div style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534' }}>
              {successMessage}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                fontWeight: 800,
                opacity: canSubmit ? 1 : 0.6,
              }}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
