"use client"

import * as React from "react"

import { Toast, ToastViewport, type ToastProps } from "./toast"

type ToastOptions = Omit<ToastProps, "className">

interface ToastContextValue {
  toast: (opts: ToastOptions) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastOptions[]>([])

  const toast = React.useCallback((opts: ToastOptions) => {
    setItems((prev) => [...prev, opts])
    // auto dismiss after 4s
    setTimeout(() => setItems((prev) => prev.slice(1)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport>
        {items.map((it, idx) => (
          <Toast key={idx} {...it} />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}


