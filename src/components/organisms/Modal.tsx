import type { ReactNode } from 'react'

type ModalProps = {
  children: ReactNode
  footer?: ReactNode
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Modal({ children, footer, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="ui-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ui-modal__header">
          <h2 className="ui-card__title">{title}</h2>
          <button className="ui-modal__close" onClick={onClose} type="button" aria-label="Close modal">
            ×
          </button>
        </header>
        <div className="ui-modal__body">{children}</div>
        {footer && <footer className="ui-modal__footer">{footer}</footer>}
      </section>
    </div>
  )
}
