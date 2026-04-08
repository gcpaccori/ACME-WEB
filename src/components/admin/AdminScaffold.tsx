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
    return { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  }
  if (tone === 'success') {
    return { background: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
  }
  if (tone === 'warning') {
    return { background: '#fffbeb', color: '#b45309', border: '#fde68a' };
  }
  if (tone === 'danger') {
    return { background: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  }
  return { background: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
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
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', color: '#6b7280', fontSize: '14px' }}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
          {item.to ? <Link to={item.to} style={{ color: '#2563eb' }}>{item.label}</Link> : <span>{item.label}</span>}
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
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
      }}
    >
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '8px 10px',
            borderRadius: '12px',
            background: '#f9fafb',
            border: '1px solid #f3f4f6',
          }}
        >
          <span style={{ color: '#6b7280', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</span>
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
    <section style={{ padding: '20px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5e7eb', display: 'grid', gap: '18px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
        {description ? <p style={{ margin: '6px 0 0', color: '#6b7280' }}>{description}</p> : null}
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
          onClick={onCancel}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
          }}
        >
          Cancelar
        </button>
      ) : null}
      {onSecondarySave ? (
        <button
          onClick={onSecondarySave}
          disabled={disabled || isSaving}
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            color: '#111827',
            opacity: disabled || isSaving ? 0.65 : 1,
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
        border: '1px solid #e5e7eb',
        background: '#ffffff',
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
    <div style={{ display: 'grid', gap: '18px' }}>
      <BreadcrumbsBar items={breadcrumbs} />
      <ContextBar items={contextItems} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>{title}</h1>
          {description ? <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{description}</p> : null}
        </div>
        {actions}
      </div>
      <div style={{ display: 'grid', gap: '18px' }}>{children}</div>
    </div>
  );
}
