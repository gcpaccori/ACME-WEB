import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      style={{
        border: '1px solid rgba(77, 20, 140, 0.28)',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, var(--acme-purple), var(--acme-orange))',
        color: 'var(--acme-white)',
        padding: '12px 18px',
        fontWeight: 800,
        opacity: props.disabled ? 0.65 : 1,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 10px 18px rgba(77, 20, 140, 0.14)',
      }}
    >
      {children}
    </button>
  );
}
