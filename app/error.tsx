"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  GraduationCap,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error)
  }, [error])

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-2">
                We encountered an error while loading this page.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please try again or go back to continue browsing.
              </p>
              
              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && error.message && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-left">
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono break-words">
                    <strong>Error:</strong> {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      <strong>Digest:</strong> {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 h-11 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-10 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
                
                <Link href="/" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 h-10 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Quick navigation:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Jobs
                  </Button>
                </Link>
                <Link href="/applications">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    Applications
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}