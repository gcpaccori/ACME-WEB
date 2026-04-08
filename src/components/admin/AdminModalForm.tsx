import { ReactNode } from 'react';

export function AdminModalForm({
  open,
  title,
  description,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.45)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          display: 'grid',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px' }}>{title}</h2>
            {description ? <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} style={{ padding: '10px 12px' }}>
            Cerrar
          </button>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>{children}</div>
        {actions ? <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>{actions}</div> : null}
      </div>
    </div>
  );
}
