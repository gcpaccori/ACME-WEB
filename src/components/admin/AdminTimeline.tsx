import { ReactNode } from 'react';

export interface AdminTimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  body?: ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

function getBulletColor(tone: AdminTimelineItem['tone']) {
  if (tone === 'info') return '#2563eb';
  if (tone === 'success') return '#059669';
  if (tone === 'warning') return '#d97706';
  if (tone === 'danger') return '#dc2626';
  return '#9ca3af';
}

export function AdminTimeline({ items }: { items: AdminTimelineItem[] }) {
  if (items.length === 0) {
    return <div style={{ color: '#6b7280' }}>No hay eventos para mostrar.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                marginTop: '6px',
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: getBulletColor(item.tone),
                flexShrink: 0,
              }}
            />
          </div>
          <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e5e7eb', display: 'grid', gap: '6px' }}>
            <strong>{item.title}</strong>
            {item.subtitle ? <span style={{ color: '#6b7280' }}>{item.subtitle}</span> : null}
            {item.body ? <div style={{ color: '#111827' }}>{item.body}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
