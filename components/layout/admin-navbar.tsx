"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme-context"
import { Shield, Sun, Moon, LogOut } from "lucide-react"
import { toast } from "sonner"

interface AdminNavbarProps {
  title?: string
  description?: string
}

export function AdminNavbar({ title = "Admin Portal", description = "Manage placement activities" }: AdminNavbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("admin_session")
    toast.success("Signed out successfully", {
      description: "You have been logged out of the admin panel",
      duration: 2000,
    })
    setTimeout(() => {
      router.push("/")
    }, 500)
  }, [router])

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}


