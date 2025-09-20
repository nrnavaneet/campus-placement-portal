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
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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
                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-sm">
                          {student?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </span>
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

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

        {/* Mobile Navigation */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
