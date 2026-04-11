import { FormEvent, useContext, useMemo, useState } from 'react';
import { PortalContext } from '../../modules/auth/session/PortalContext';
import { getAdminModuleByPath } from '../../core/admin/registry/moduleRegistry';
import { useLocation } from 'react-router-dom';
import { AdminModalForm } from '../../components/admin/AdminModalForm';
import { FieldGroup } from '../../components/admin/AdminFields';
import { FormStatusBar } from '../../components/admin/AdminScaffold';
import { TextField } from '../../components/ui/TextField';
import { getPortalActorLabel, getScopeLabel } from '../../core/auth/portalAccess';
import { authService } from '../../core/services/authService';

interface PortalHeaderProps {
  onMenuClick: () => void;
}

export function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const portal = useContext(PortalContext);
  const location = useLocation();
  const activeModule = getAdminModuleByPath(location.pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  const title = activeModule?.label ?? 'Resumen';
  const actorLabel = useMemo(
    () =>
      getPortalActorLabel({
        roleAssignments: portal.roleAssignments,
        profile: portal.profile,
        staffAssignment: portal.staffAssignment,
      }),
    [portal.profile, portal.roleAssignments, portal.staffAssignment]
  );

  const openProfileModal = () => {
    setProfileForm({
      full_name: portal.profile?.full_name ?? '',
      phone: portal.profile?.phone ?? '',
    });
    setProfileError(null);
    setProfileSuccess(null);
    setProfileOpen(true);
  };

  const closeProfileModal = () => {
    if (savingProfile) return;
    setProfileOpen(false);
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!portal.sessionUserId) {
      setProfileError('No se encontro la sesion del usuario.');
      return;
    }

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const result = await authService.updateOwnPortalProfile({
      userId: portal.sessionUserId,
      full_name: profileForm.full_name,
      phone: profileForm.phone,
    });

    if (result.error) {
      setSavingProfile(false);
      setProfileError(result.error.message);
      return;
    }

    await portal.reloadPortalContext();
    setSavingProfile(false);
    setProfileSuccess('Perfil actualizado');
    setProfileOpen(false);
  };

  return (
    <>
      <header className="portal-header">
        <div className="portal-header__container">
          <div className="portal-header__left">
            <button className="portal-menu-btn" onClick={onMenuClick}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--acme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal</span>
              <h1 className="portal-header__title" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
            </div>
          </div>

          <div className="portal-header__search">
            <div className="portal-header__search-input-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="portal-header__search-placeholder">Buscar funciones...</span>
              <kbd className="portal-header__search-kbd">/</kbd>
            </div>
          </div>

          <div className="portal-header__right">
            <button className="portal-header-action" title="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            <button className="portal-header-action" title="Ayuda">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--acme-border)', margin: '0 8px' }} />

            <button
              type="button"
              className="portal-user-profile"
              onClick={openProfileModal}
              title="Editar mi perfil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(15, 23, 42, 0.06)',
                background: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <div className="portal-user-avatar" style={{ border: '2px solid rgba(15, 23, 42, 0.05)' }}>
                {portal.profile?.full_name?.[0] || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--acme-text)' }}>{portal.profile?.full_name || 'Admin'}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--acme-text-muted)' }}>{getScopeLabel(portal.currentScopeType)}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--acme-text-muted)', marginLeft: '4px' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <AdminModalForm
        open={profileOpen}
        title="Mi perfil"
        description="Actualiza tus datos base del portal. Tus permisos y accesos se siguen administrando desde Seguridad."
        onClose={closeProfileModal}
        actions={
          <>
            <button type="button" onClick={closeProfileModal} disabled={savingProfile} style={{ padding: '12px 16px' }}>
              Cancelar
            </button>
            <button
              type="submit"
              form="portal-profile-form"
              disabled={savingProfile}
              style={{ padding: '12px 16px', background: '#111827', color: '#ffffff', borderRadius: '10px' }}
            >
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <FormStatusBar dirty saving={savingProfile} error={profileError} successMessage={profileSuccess} />
        <form id="portal-profile-form" onSubmit={handleProfileSave} style={{ display: 'grid', gap: '16px' }}>
          <FieldGroup label="Nombre completo" hint="Este nombre se reflejara en tu cabecera y en la ficha base del portal.">
            <TextField value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Tu nombre" />
          </FieldGroup>
          <FieldGroup label="Telefono" hint="Dato opcional para mantener tu ficha interna al dia.">
            <TextField value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Telefono" />
          </FieldGroup>
          <FieldGroup label="Correo" hint="El correo se gestiona desde autenticacion y no se edita en este modal.">
            <TextField value={portal.profile?.email || ''} disabled />
          </FieldGroup>
          <div
            style={{
              display: 'grid',
              gap: '8px',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--acme-border)',
              background: 'rgba(255, 255, 255, 0.84)',
            }}
          >
            <strong style={{ fontSize: '14px' }}>Tu acceso actual</strong>
            <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>Capa activa: {getScopeLabel(portal.currentScopeType)}</span>
            <span style={{ color: 'var(--acme-text-muted)', fontSize: '13px' }}>Perfil operativo: {actorLabel}</span>
          </div>
        </form>
      </AdminModalForm>
    </>
  );
}
