"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Home, 
  ArrowLeft, 
  Search, 
  GraduationCap,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"

export default function NotFound() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoBack = () => {
    setIsLoading(true)
    router.back()
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Campus Placement Portal
            </h1>
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 sm:p-12">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="relative">
                <div className="text-8xl sm:text-9xl font-bold text-gray-200 dark:text-gray-700 select-none">
                  404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-orange-500 animate-bounce" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Page Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-2">
                Oops! The page you're looking for doesn't exist.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                disabled={isLoading}
              >
                <ArrowLeft className="w-5 h-5" />
                {isLoading ? "Going Back..." : "Go Back"}
              </Button>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? "Refreshing..." : "Refresh Page"}
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Or try one of these options:
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
                
                <Link href="/jobs">
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center gap-2 h-11 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200"
                  >
                    <Search className="w-4 h-4" />
                    Browse Jobs
                  </Button>
                </Link>
                
                <Link href="/applications">
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center gap-2 h-11 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Applications
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact support at{" "}
            <a 
              href="mailto:support@msruas.ac.in" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@msruas.ac.in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}