import { FormEvent, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../core/constants/routes';
import { PortalContext } from '../session/PortalContext';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { authService } from '../../../core/services/authService';
import { supabase } from '../../../integrations/supabase/client';

export function LoginPage() {
  const navigate = useNavigate();
  const portal = useContext(PortalContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [magicSent, setMagicSent] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate(AppRoutes.portal.dashboard);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) navigate(AppRoutes.portal.dashboard);
    });

    return () => listener.subscription?.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRecoverySent(false);
    setLoading(true);

    if (mode === 'password') {
      const result = await portal.signIn(email, password);
      setLoading(false);
      if (result?.error) {
        setError(result.error.message ?? 'No se pudo iniciar sesión con contraseña');
        return;
      }

      navigate(AppRoutes.portal.dashboard);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message ?? 'No se pudo enviar el correo de verificación');
      return;
    }

    setMagicSent(true);
  };

  const handlePasswordRecovery = async () => {
    if (!email.trim()) {
      setError('Ingresa el correo del usuario para enviar la recuperacion.');
      return;
    }

    setLoading(true);
    setError(null);
    setMagicSent(false);

    const result = await authService.requestPasswordRecovery(
      email.trim(),
      `${window.location.origin}${AppRoutes.public.portalPasswordRecovery}`
    );

    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'No se pudo enviar el correo de recuperacion');
      return;
    }

    setRecoverySent(true);
  };

  if (magicSent || recoverySent) {
    return (
      <section style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
          }}>📧</div>

          <div>
            <p style={{ fontSize: '16px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>
              Revisa tu correo
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
              Enviamos un enlace de verificación a{' '}
              <strong style={{ color: '#111827' }}>{email}</strong>.
              Haz clic en él para acceder al panel.
            </p>
          </div>

          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 16px',
            width: '100%',
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
              ¿No lo recibiste? Revisa tu carpeta de spam o contacta al soporte de ACME Pedidos.
            </p>
          </div>

          <Button
            onClick={() => {
              setMagicSent(false);
              setRecoverySent(false);
            }}
            style={{
              marginTop: '4px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              color: '#374151',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Volver al formulario
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section style={{
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '22px',
          }}>🏪</div>
          <p style={{ fontSize: '18px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>
            Acceso al portal
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            Solo para socios y personal autorizado de ACME Pedidos
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '6px',
          }}>
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setError(null);
                setRecoverySent(false);
              }}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '8px 10px',
                background: mode === 'password' ? '#111827' : 'transparent',
                color: mode === 'password' ? '#ffffff' : '#374151',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Con contraseña
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('magic');
                setError(null);
                setRecoverySent(false);
              }}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '8px 10px',
                background: mode === 'magic' ? '#111827' : 'transparent',
                color: mode === 'magic' ? '#ffffff' : '#374151',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Verificar correo
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                Correo electrónico
              </span>
              <TextField
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              />
            </label>

            {mode === 'password' ? (
              <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  Contraseña
                </span>
                <TextField
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </label>
              <button
                type="button"
                onClick={handlePasswordRecovery}
                disabled={loading}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: '#2563eb',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.65 : 1,
                  justifySelf: 'flex-start',
                }}
              >
                Recuperar contraseña por correo
              </button>
              </>
            ) : (
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0,
                lineHeight: '1.5',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                Te enviaremos un enlace seguro al correo para ingresar sin contraseña.
              </p>
            )}

            {error && (
              <div style={{
                fontSize: '13px',
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: '#111827',
                border: 'none',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginTop: '4px',
              }}
            >
              {loading
                ? mode === 'password'
                  ? 'Ingresando...'
                  : 'Enviando verificación...'
                : mode === 'password'
                  ? 'Ingresar'
                  : 'Verificar correo'}
            </Button>
          </form>
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: '1.6' }}>
          ¿Sin acceso autorizado? Contacta al equipo de soporte para solicitar credenciales.
        </p>
      </div>
    </section>
  );
}
