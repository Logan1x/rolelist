import { useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(43, 44, 52, 0.6)' }}
        onClick={onClose}
      />

      <div className="relative mx-auto mt-24 w-[min(92vw,720px)]">
        <div 
          className="rounded-lg border p-5 shadow-2xl"
          style={{ 
            borderColor: '#d1d1e9', 
            backgroundColor: '#fffffe'
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold" style={{ color: '#2b2c34' }}>{title ?? 'Modal'}</div>
            </div>
            <button
              type="button"
              className="rounded-lg border p-2 transition-colors"
              style={{ 
                borderColor: '#d1d1e9', 
                backgroundColor: '#fffffe', 
                color: '#2b2c34'
              }}
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
