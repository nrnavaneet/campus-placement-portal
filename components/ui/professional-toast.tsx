"use client"

import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    style: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#065f46',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
  })
}

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    style: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  })
}

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    style: {
      background: '#fffbeb',
      border: '1px solid #fed7aa',
      color: '#92400e',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
  })
}

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    style: {
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      color: '#0c4a6e',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    icon: <Info className="w-5 h-5 text-blue-600" />,
  })
}

// Dark mode variations
export const showSuccessToastDark = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    style: {
      background: '#064e3b',
      border: '1px solid #065f46',
      color: '#d1fae5',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    },
    icon: <CheckCircle className="w-5 h-5 text-green-400" />,
  })
}

export const showErrorToastDark = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    style: {
      background: '#7f1d1d',
      border: '1px solid #991b1b',
      color: '#fecaca',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    },
    icon: <XCircle className="w-5 h-5 text-red-400" />,
  })
}