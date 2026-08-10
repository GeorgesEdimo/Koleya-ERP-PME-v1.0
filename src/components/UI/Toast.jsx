import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', iconColor: 'text-success-500' },
  error: { icon: XCircle, bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', iconColor: 'text-danger-500' },
  warning: { icon: AlertTriangle, bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-700', iconColor: 'text-accent-500' },
  info: { icon: Info, bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', iconColor: 'text-primary-500' },
}

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, duration }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 6000),
    warning: (msg) => addToast(msg, 'warning', 5000),
    info: (msg) => addToast(msg, 'info'),
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Container des toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const config = TOAST_TYPES[t.type] || TOAST_TYPES.info
          const Icon = config.icon
          return (
            <div
              key={t.id}
              className={`${config.bg} ${config.border} border rounded-xl p-4 shadow-lg pointer-events-auto transform transition-all duration-300 animate-slide-in`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <p className={`text-sm ${config.text} flex-1`}>{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className={`${config.text} opacity-50 hover:opacity-100 flex-shrink-0`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
