"use client"

import React from 'react'
import ErrorBoundary from './error-boundary'
import { ErrorHandler } from '@/lib/error-handler'

interface SafeComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showDetails?: boolean
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// Enhanced ErrorBoundary with integrated error handling
const SafeComponent: React.FC<SafeComponentProps> = ({
  children,
  fallback,
  showDetails = false,
  onError
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error using our error handler
    ErrorHandler.logError(error, { 
      componentStack: errorInfo.componentStack,
      errorBoundary: true 
    })
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  // Custom error boundary that integrates with our error handling system
  class IntegratedErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      handleError(error, errorInfo)
    }

    render() {
      if (this.state.hasError) {
        return fallback || (
          <ErrorBoundary showDetails={showDetails}>
            {children}
          </ErrorBoundary>
        )
      }

      return this.props.children
    }
  }

  return (
    <IntegratedErrorBoundary>
      {children}
    </IntegratedErrorBoundary>
  )
}

export default SafeComponent

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error | string, context?: Record<string, any>) => {
    if (typeof error === 'string') {
      const errorObj = new Error(error)
      ErrorHandler.logError(errorObj, context)
      ErrorHandler.showErrorToast(errorObj)
    } else {
      ErrorHandler.logError(error, context)
      ErrorHandler.showErrorToast(error)
    }
  }, [])

  const handleAsyncError = React.useCallback(async <T,>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    const { data } = await ErrorHandler.withErrorHandling(operation, context)
    return data
  }, [])

  return { handleError, handleAsyncError }
}