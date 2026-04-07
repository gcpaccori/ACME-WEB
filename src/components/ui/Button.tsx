import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...props}
      style={{
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        background: '#111827',
        color: '#ffffff',
        padding: '12px 18px',
        fontWeight: 600,
        opacity: props.disabled ? 0.65 : 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}
