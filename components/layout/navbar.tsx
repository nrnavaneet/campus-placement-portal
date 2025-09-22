"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/contexts/theme-context"
import { supabaseClient, type StudentDetails } from "@/lib/supabase"
import {
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  GraduationCap,
  Briefcase,
  FileText,
  Home,
  Menu,
  X,
  MessageSquare,
} from "lucide-react"

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      setUser(user)

      if (user) {
        // Try localStorage first (demo mode)
        const storedProfile = localStorage.getItem("student_profile")
        if (storedProfile) {
          const studentData = JSON.parse(storedProfile)
          setStudent(studentData)
          calculateProfileCompletion(studentData)
        } else {
          // Try to fetch from database
          try {
            const { data, error } = await supabaseClient
              .from("student_details")
              .select("*")
              .eq("user_id", user.id)
              .single()

            if (data) {
              setStudent(data)
              calculateProfileCompletion(data)
            }
          } catch (error) {
            console.log("No student profile found")
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProfileCompletion = (studentData: StudentDetails) => {
    let completed = 0
    const totalFields = 12

    if (studentData.first_name) completed++
    if (studentData.gender) completed++
    if (studentData.college_reg_no) completed++
    if (studentData.date_of_birth) completed++
    if (studentData.college_email) completed++
    if (studentData.personal_email) completed++
    if (studentData.mobile_number) completed++
    if (studentData.branch) completed++
    if (studentData.ug_percentage) completed++
    if (studentData.resume_url) completed++
    if (studentData.ug_percentage >= 60) completed++
    if (!studentData.active_backlogs) completed++

    const percentage = Math.round((completed / totalFields) * 100)
    setProfileCompletion(percentage)
  }

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    setUser(null)
    setStudent(null)
    router.push("/")
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/applications", label: "Applications", icon: FileText },
    { href: "/grievance", label: "Grievance", icon: MessageSquare },
  ]

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Campus Placement Portal
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="transition-all duration-200"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            {user ? (
              <>
                {/* User menu - Desktop only */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex">
                      <div className={`w-full h-full flex items-center justify-center shadow-lg border-2 rounded-lg ${
                        theme === "dark" 
                          ? "bg-gradient-to-br from-blue-600 to-purple-700 border-blue-500/20" 
                          : "bg-gradient-to-br from-blue-500 to-purple-600 border-white/20"
                      }`}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {student ? (
                          <>
                            <p className="font-medium">{student.first_name}</p>
                            <p className="w-[200px] truncate text-sm text-muted-foreground">{student.college_email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {student.college_reg_no}
                              </Badge>
                              {profileCompletion < 100 && (
                                <Badge variant="secondary" className="text-xs">
                                  {profileCompletion}% Complete
                                </Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{user.email}</p>
                            <Badge variant="outline" className="text-xs w-fit">
                              Profile Incomplete
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Enhanced Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden relative h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <div className={`transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`}>
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    )}
                  </div>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg">
            {/* User Profile Section */}
            <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 flex items-center justify-center shadow-lg border-2 rounded-full ${
                  theme === "dark" 
                    ? "bg-gradient-to-br from-blue-600 to-purple-700 border-blue-500/30" 
                    : "bg-gradient-to-br from-blue-500 to-purple-600 border-white/30"
                }`}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {student ? (
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {student.first_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {student.college_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {student.college_reg_no}
                        </Badge>
                        {profileCompletion < 100 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {profileCompletion}% Complete
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.email}
                      </p>
                      <Badge variant="outline" className="text-xs w-fit mt-1">
                        Profile Incomplete
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-3">
              <div className="space-y-1">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:scale-[0.98] ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 shadow-md border border-blue-200 dark:border-blue-700/50"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive(item.href)
                        ? "bg-white/70 dark:bg-gray-800/70 shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Actions */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Profile</span>
                </Link>
                
                <Link
                  href="/settings"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-[0.98]"
                >
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
