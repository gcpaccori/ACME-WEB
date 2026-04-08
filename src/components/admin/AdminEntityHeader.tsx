import { ReactNode } from 'react';
import { StatusPill } from './AdminScaffold';

export function AdminEntityHeader({
  title,
  description,
  status,
  actions,
}: {
  title: string;
  description?: string;
  status?: { label: string; tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' };
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        padding: '20px',
        borderRadius: '18px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ display: 'grid', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>{title}</h2>
          {status ? <StatusPill label={status.label} tone={status.tone} /> : null}
        </div>
        {description ? <p style={{ margin: 0, color: '#6b7280' }}>{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
