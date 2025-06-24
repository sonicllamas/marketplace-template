"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { X } from "lucide-react"
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length > 0) {
      const currentToast = toasts[toasts.length - 1]
      const timer = setTimeout(() => {
        removeToast(currentToast.id)
      }, currentToast.duration || 5000) // Use duration from toast or default to 5000

      return () => clearTimeout(timer)
    }
  }, [toasts, removeToast])

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-200 text-green-900"
      case "error":
        return "bg-red-100 border-red-200 text-red-900"
      case "warning":
        return "bg-yellow-100 border-yellow-200 text-yellow-900"
      case "info":
        return "bg-blue-100 border-blue-200 text-blue-900"
      default:
        return "bg-gray-100 border-gray-200 text-gray-900"
    }
  }

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-md border shadow-sm w-full max-w-sm flex items-center space-x-2 ${getToastStyles(toast.type)}`}
          >
            {getToastIcon(toast.type)}
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0">
              <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
