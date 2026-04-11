import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export type AdminTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface AdminBreadcrumb {
  label: string;
  to?: string;
}

export interface AdminContextItem {
  label: string;
  value: string;
  tone?: AdminTone;
}

function getToneStyles(tone: AdminTone = 'neutral') {
  if (tone === 'info') {
    return { background: 'rgba(77, 20, 140, 0.08)', color: 'var(--acme-purple)', border: 'rgba(77, 20, 140, 0.20)' };
  }
  if (tone === 'success') {
    return { background: 'rgba(34, 197, 94, 0.10)', color: '#166534', border: 'rgba(34, 197, 94, 0.22)' };
  }
  if (tone === 'warning') {
    return { background: 'rgba(255, 98, 0, 0.10)', color: 'var(--acme-orange)', border: 'rgba(255, 98, 0, 0.26)' };
  }
  if (tone === 'danger') {
    return { background: 'rgba(239, 68, 68, 0.10)', color: '#991b1b', border: 'rgba(239, 68, 68, 0.22)' };
  }
  return { background: 'rgba(17, 24, 39, 0.04)', color: 'var(--acme-text)', border: 'var(--acme-border)' };
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: AdminTone }) {
  const styles = getToneStyles(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: '999px',
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: styles.color,
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

export function BreadcrumbsBar({ items }: { items: AdminBreadcrumb[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        color: 'var(--acme-text-muted)',
        fontSize: '14px',
      }}
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          {item.to ? <Link to={item.to} style={{ color: 'var(--acme-purple)', fontWeight: 800 }}>{item.label}</Link> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  );
}

export function ContextBar({ items }: { items: AdminContextItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '14px',
        borderRadius: 'var(--acme-radius-lg)',
        border: '1px solid var(--acme-border)',
        background: 'var(--acme-surface)',
        boxShadow: 'var(--acme-shadow-sm)',
      }}
    >
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: 'var(--acme-radius-md)',
            background: 'var(--acme-surface-muted)',
            border: '1px solid var(--acme-border)',
          }}
        >
          <span style={{ color: 'var(--acme-text-muted)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
          <StatusPill label={item.value} tone={item.tone} />
        </div>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        padding: '24px',
        borderRadius: 'var(--acme-radius-lg)',
        background: 'var(--acme-surface)',
        border: '1px solid var(--acme-border)',
        boxShadow: 'var(--acme-shadow-sm)',
        display: 'grid',
        gap: '20px',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h2>
        {description ? <p style={{ margin: '6px 0 0', color: 'var(--acme-text-muted)', fontSize: '14px' }}>{description}</p> : null}
      </div>
      <div style={{ display: 'grid', gap: '16px' }}>{children}</div>
    </section>
  );
}

export function SaveActions({
  onSave,
  onCancel,
  onSecondarySave,
  saveLabel = 'Guardar',
  secondaryLabel = 'Guardar y seguir',
  isSaving = false,
  disabled = false,
}: {
  onSave: () => void;
  onCancel?: () => void;
  onSecondarySave?: () => void;
  saveLabel?: string;
  secondaryLabel?: string;
  isSaving?: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--acme-radius-md)',
            border: '1px solid var(--acme-border)',
            background: 'var(--acme-surface)',
            color: 'var(--acme-text)',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          Cancelar
        </button>
      ) : null}
      {onSecondarySave ? (
        <button
          type="button"
          onClick={onSecondarySave}
          disabled={disabled || isSaving}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--acme-radius-md)',
            border: '1px solid var(--acme-border)',
            background: 'var(--acme-surface)',
            color: 'var(--acme-text)',
            fontWeight: 700,
            fontSize: '14px',
            opacity: disabled || isSaving ? 0.65 : 1,
            cursor: disabled || isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {secondaryLabel}
        </button>
      ) : null}
      <Button disabled={disabled || isSaving} onClick={onSave}>
        {isSaving ? 'Guardando...' : saveLabel}
      </Button>
    </div>
  );
}

export function FormStatusBar({
  dirty,
  saving,
  error,
  successMessage,
}: {
  dirty: boolean;
  saving: boolean;
  error?: string | null;
  successMessage?: string | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1px solid var(--acme-border)',
        background: 'rgba(255, 255, 255, 0.86)',
        boxShadow: 'var(--acme-shadow-sm)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <StatusPill label={saving ? 'Guardando' : dirty ? 'Cambios pendientes' : 'Sin cambios'} tone={saving ? 'info' : dirty ? 'warning' : 'success'} />
      {successMessage ? <StatusPill label={successMessage} tone="success" /> : null}
      {error ? <StatusPill label={error} tone="danger" /> : null}
    </div>
  );
}

export function AdminPageFrame({
  title,
  description,
  breadcrumbs,
  contextItems,
  actions,
  children,
}: {
  title: string;
  description?: string;
  breadcrumbs: AdminBreadcrumb[];
  contextItems: AdminContextItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div style={{ display: 'grid', gap: '16px' }}>
        <BreadcrumbsBar items={breadcrumbs} />
        <ContextBar items={contextItems} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--acme-text)' }}>{title}</h1>
          {description ? <p style={{ margin: 0, color: 'var(--acme-text-muted)', fontSize: '15px', maxWidth: '800px', lineHeight: '1.5' }}>{description}</p> : null}
        </div>
        {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>{children}</div>
    </div>
  );
}
