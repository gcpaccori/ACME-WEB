import { ReactNode } from 'react';

export interface AdminDataTableColumn<TRecord> {
  id: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (record: TRecord) => ReactNode;
}

export function AdminDataTable<TRecord>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No hay registros para mostrar.',
}: {
  columns: AdminDataTableColumn<TRecord>[];
  rows: TRecord[];
  getRowId: (record: TRecord) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <div className="empty-state__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <p className="empty-state__desc">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--acme-radius-lg)', border: '1px solid var(--acme-border)', background: 'var(--acme-surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--acme-surface-muted)' }}>
            {columns.map((column) => (
              <th
                key={column.id}
                style={{
                  padding: '12px 16px',
                  textAlign: column.align ?? 'left',
                  color: 'var(--acme-text-faint)',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  width: column.width,
                  whiteSpace: 'nowrap',
                  borderBottom: '1px solid var(--acme-border)',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowId(row)}
              style={{ borderTop: '1px solid var(--acme-border)', transition: 'background 0.12s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--acme-surface-muted)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  style={{
                    padding: '14px 16px',
                    textAlign: column.align ?? 'left',
                    verticalAlign: 'top',
                    color: 'var(--acme-text)',
                    fontSize: '14px',
                  }}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
