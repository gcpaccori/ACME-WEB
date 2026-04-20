import { FormEvent, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard, StatusPill } from '../../../components/admin/AdminScaffold';
import { resolvePortalLandingRoute } from '../../../core/auth/portalLanding';
import { TextField } from '../../../components/ui/TextField';
import { AppRoutes } from '../../../core/constants/routes';
import { merchantAccessService } from '../../../core/services/merchantAccessService';
import { supabase } from '../../../integrations/supabase/client';
import { PortalContext } from '../session/PortalContext';

export function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const portal = useContext(PortalContext);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(Boolean(session));
      setCheckingSession(false);
    };

    checkRecoverySession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setHasRecoverySession(Boolean(session));
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

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

  const canSubmit = hasRecoverySession && password.length >= 8 && confirmPassword === password && !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await merchantAccessService.updateOwnPassword(password);
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage('Contraseña actualizada. Redirigiendo al portal...');
    await portal.reloadPortalContext();
    navigate(resolvePortalLandingRoute(portal), { replace: true });
  };

  if (checkingSession) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', display: 'grid', gap: '18px' }}>
        <SectionCard title="Recuperar contraseña" description="Estamos validando el enlace de recuperacion recibido por correo.">
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Un momento, por favor...</div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'grid', gap: '18px' }}>
      <SectionCard
        title="Recuperar contraseña"
        description="Usa este formulario despues de abrir el enlace enviado a tu correo para definir una nueva contraseña."
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <StatusPill label={portal.profile?.email || portal.accessControl?.email || 'Sesion de recuperacion'} tone="info" />
          <StatusPill label={hasRecoverySession ? 'Enlace valido' : 'Falta validar enlace'} tone={hasRecoverySession ? 'success' : 'warning'} />
        </div>

        {!hasRecoverySession ? (
          <div style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e' }}>
            Abre esta pantalla desde el enlace que llega a tu correo. Si el enlace vencio, vuelve al login y solicita otra recuperacion.
          </div>
        ) : null}

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

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate(AppRoutes.public.portalLogin)}
              style={{ padding: '12px 18px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontWeight: 700 }}
            >
              Volver al login
            </button>
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
