import { useState } from "react"

type Toast = {
  title?: string
  description?: string
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (t: Toast) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
  }

  return { toast, toasts }
}
