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
      <div
        style={{
          padding: '18px',
          borderRadius: '14px',
          border: '1px dashed #d1d5db',
          background: '#f9fafb',
          color: '#6b7280',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {columns.map((column) => (
              <th
                key={column.id}
                style={{
                  padding: '14px 16px',
                  textAlign: column.align ?? 'left',
                  color: '#6b7280',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowId(row)} style={{ borderTop: index === 0 ? '1px solid #e5e7eb' : undefined }}>
              {columns.map((column) => (
                <td
                  key={column.id}
                  style={{
                    padding: '14px 16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: column.align ?? 'left',
                    verticalAlign: 'top',
                    color: '#111827',
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
