"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

export function ToastDismissOnRouteChange() {
  const pathname = usePathname()

  useEffect(() => {
    // Dismiss all toasts when route changes
    toast.dismiss()
  }, [pathname])

  return null
}