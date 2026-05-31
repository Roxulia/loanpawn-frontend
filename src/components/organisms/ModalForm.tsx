import type { FormHTMLAttributes, ReactNode } from 'react'
import { Button } from '../atoms'
import { Modal } from './Modal'

type ModalFormProps = FormHTMLAttributes<HTMLFormElement> & {
  cancelLabel?: string
  children: ReactNode
  confirmLabel?: string
  isLoading?: boolean
  isOpen: boolean
  onCancel: () => void
  title: string
}

export function ModalForm({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Save',
  isLoading = false,
  isOpen,
  onCancel,
  title,
  ...formProps
}: ModalFormProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <form className="ui-form" {...formProps}>
        {children}
        <div className="ui-modal__footer">
          <Button onClick={onCancel} variant="secondary">{cancelLabel}</Button>
          <Button isLoading={isLoading} type="submit" variant="primary">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
