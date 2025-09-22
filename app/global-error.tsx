"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  GraduationCap,
  Bug,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Campus Placement Portal
                </h1>
              </div>
            </div>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8 sm:p-12">
                {/* Error Icon */}
                <div className="mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <Bug className="w-12 h-12 text-red-600 dark:text-red-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Something went wrong!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-2">
                    We encountered an unexpected error while processing your request.
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-4">
                    Our team has been notified and is working to fix this issue.
                  </p>
                  
                  {/* Error Details (Development Mode) */}
                  {process.env.NODE_ENV === 'development' && error.message && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-left">
                      <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                        <strong>Error:</strong> {error.message}
                      </p>
                      {error.digest && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          <strong>Digest:</strong> {error.digest}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <Button
                    onClick={reset}
                    className="flex items-center justify-center gap-2 h-12 text-base bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={handleReload}
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-12 text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reload Page
                  </Button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Or navigate to a safe area:
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href="/">
                      <Button 
                        variant="ghost" 
                        className="w-full flex items-center justify-center gap-2 h-11 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                      >
                        <Home className="w-4 h-4" />
                        Home Page
                      </Button>
                    </Link>
                    
                    <Link href="/dashboard">
                      <Button 
                        variant="ghost" 
                        className="w-full flex items-center justify-center gap-2 h-11 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Information */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                If this problem persists, please contact our support team:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
                <a 
                  href="mailto:support@msruas.ac.in" 
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  support@msruas.ac.in
                </a>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Include error details for faster assistance
                </span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}