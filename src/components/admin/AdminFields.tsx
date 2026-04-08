import { ChangeEventHandler, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { TextField } from '../ui/TextField';

export interface SelectOption {
  value: string;
  label: string;
}

export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'grid', gap: '8px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: '12px', color: '#6b7280' }}>{hint}</span> : null}
    </label>
  );
}

export function TextAreaField(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        minHeight: '96px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        background: '#ffffff',
        color: '#111827',
        resize: 'vertical',
      }}
    />
  );
}

export function SelectField({
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #d1d5db',
        background: '#ffffff',
        color: '#111827',
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function RelationSelect(props: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return <SelectField {...props} />;
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', color: '#111827' }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export function NumberField(props: React.ComponentProps<typeof TextField>) {
  return <TextField {...props} type={props.type ?? 'number'} />;
}
