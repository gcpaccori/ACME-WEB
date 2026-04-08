import { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { AdminModalForm } from './AdminModalForm';

export function AdminActionDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  isLoading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AdminModalForm
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose} style={{ padding: '12px 16px' }}>
            {cancelLabel}
          </button>
          <Button onClick={onConfirm} disabled={confirmDisabled || isLoading}>
            {isLoading ? 'Procesando...' : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </AdminModalForm>
  );
}
