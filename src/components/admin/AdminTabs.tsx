import { ReactNode } from 'react';

export interface AdminTabItem {
  id: string;
  label: string;
  badge?: string;
}

export function AdminTabs({
  tabs,
  activeTabId,
  onChange,
}: {
  tabs: AdminTabItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 14px',
              borderRadius: '999px',
              border: `1px solid ${active ? '#c7d2fe' : '#e5e7eb'}`,
              background: active ? '#eef2ff' : '#ffffff',
              color: active ? '#3730a3' : '#374151',
              display: 'inline-flex',
              gap: '8px',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: active ? '#c7d2fe' : '#f3f4f6',
                  fontSize: '12px',
                }}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AdminTabPanel({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: '16px' }}>{children}</div>;
}
