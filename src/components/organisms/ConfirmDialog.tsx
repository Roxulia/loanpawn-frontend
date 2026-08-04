import { Button } from '../atoms'
import { Alert } from '../feedback'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  confirmLabel?: string
  isLoading?: boolean
  isOpen: boolean
  message: string
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export function ConfirmDialog({
  confirmLabel = 'Confirm',
  isLoading = false,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  function handleCancel() {
    if (!isLoading) {
      onCancel()
    }
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={isLoading} onClick={handleCancel} variant="secondary">Cancel</Button>
          <Button isLoading={isLoading} onClick={onConfirm} variant="danger">
            {confirmLabel}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
    >
      <Alert message={message} title="Please confirm this action" tone="warning" />
    </Modal>
  )
}
