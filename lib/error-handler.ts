import { toast } from "@/hooks/use-toast"

// Error types for better error handling
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: string
  statusCode?: number
  timestamp: Date
  context?: Record<string, any>
}

// Error handling utility class
export class ErrorHandler {
  // Log errors (in production, this would send to an error reporting service)
  static logError(error: AppError | Error, context?: Record<string, any>) {
    const errorInfo = {
      message: error.message,
      timestamp: new Date().toISOString(),
      context,
      ...(error instanceof Error && { stack: error.stack }),
      ...('type' in error && { type: error.type, statusCode: error.statusCode })
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo)
    } else {
      // In production, send to error reporting service
      // Example: Sentry.captureException(error, { contexts: { custom: context } })
    }
  }

  // Create standardized error object
  static createError(
    type: ErrorType,
    message: string,
    statusCode?: number,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    return {
      type,
      message,
      details,
      statusCode,
      timestamp: new Date(),
      context
    }
  }

  // Handle API errors
  static handleApiError(error: any, context?: Record<string, any>): AppError {
    let appError: AppError

    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const message = error.response.data?.message || error.response.statusText || 'Server error'

      if (status === 401) {
        appError = this.createError(ErrorType.AUTHENTICATION, 'Authentication required', status, message, context)
      } else if (status === 403) {
        appError = this.createError(ErrorType.AUTHORIZATION, 'Access denied', status, message, context)
      } else if (status === 404) {
        appError = this.createError(ErrorType.NOT_FOUND, 'Resource not found', status, message, context)
      } else if (status >= 400 && status < 500) {
        appError = this.createError(ErrorType.CLIENT, message, status, undefined, context)
      } else {
        appError = this.createError(ErrorType.SERVER, 'Server error occurred', status, message, context)
      }
    } else if (error.request) {
      // Network error
      appError = this.createError(
        ErrorType.NETWORK,
        'Network error - please check your connection',
        0,
        error.message,
        context
      )
    } else {
      // Other error
      appError = this.createError(ErrorType.UNKNOWN, error.message || 'Unknown error occurred', 0, undefined, context)
    }

    this.logError(appError, context)
    return appError
  }

  // Show user-friendly error toast
  static showErrorToast(error: AppError | Error | string, title?: string) {
    let message: string
    let description: string | undefined

    if (typeof error === 'string') {
      message = error
    } else if (error instanceof Error) {
      message = error.message
    } else {
      message = error.message
      description = error.details
    }

    toast({
      title: title || 'Error',
      description: message,
      variant: 'destructive',
    })
  }

  // Handle async operations with error handling
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
    showToast = true
  ): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const data = await operation()
      return { data, error: null }
    } catch (error) {
      const appError = this.handleApiError(error, context)
      
      if (showToast) {
        this.showErrorToast(appError)
      }
      
      return { data: null, error: appError }
    }
  }
}

// Validation helpers
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`, fieldName.toLowerCase())
  }
}

// Retry mechanism for failed operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      ErrorHandler.logError(lastError, { attempt, maxRetries })
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}

// Safe async component wrapper
export const safeAsync = <T extends any[]>(
  fn: (...args: T) => Promise<void>
) => {
  return async (...args: T) => {
    try {
      await fn(...args)
    } catch (error) {
      ErrorHandler.logError(error as Error, { function: fn.name, args })
      ErrorHandler.showErrorToast(error as Error, 'Operation Failed')
    }
  }
}

// React Query error handler
export const queryErrorHandler = (error: any) => {
  const appError = ErrorHandler.handleApiError(error)
  
  // Don't show toast for certain error types
  if (appError.type !== ErrorType.AUTHENTICATION) {
    ErrorHandler.showErrorToast(appError)
  }
  
  return appError
}

// Default error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Please check your internet connection and try again.',
  AUTHENTICATION: 'Please log in to continue.',
  AUTHORIZATION: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error occurred. Please try again later.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
} as const