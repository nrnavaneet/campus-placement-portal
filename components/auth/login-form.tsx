"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabaseClient } from "@/lib/supabase"
import { Eye, EyeOff, GraduationCap, Shield } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const validateStudentEmail = (email: string) => {
    const regex = /^22[a-zA-Z0-9]*@msruas\.ac\.in$/
    return regex.test(email)
  }

  const handleStudentLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!validateStudentEmail(email)) {
      setError("Please use your college email (format: 22xxxxx@msruas.ac.in)")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if student profile exists
      const { data: studentData, error: studentError } = await supabaseClient
        .from("student_details")
        .select("*")
        .eq("user_id", data.user?.id)
        .single()

      if (studentError && studentError.code === "PGRST116") {
        // Student profile doesn't exist, redirect to registration
        router.push("/register")
      } else {
        // Student profile exists, go to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!validateStudentEmail(email)) {
      setError("Please use your college email (format: 22xxxxx@msruas.ac.in)")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // Email already confirmed (demo mode)
          setSuccess("Registration successful! Redirecting to complete your profile...")
          setTimeout(() => {
            router.push("/register")
          }, 2000)
        } else {
          // Email verification required
          setSuccess("Registration successful! Please check your email to verify your account before proceeding.")
        }
      }
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    try {
      // For demo purposes, use hardcoded admin credentials
      if (username === "admin" && password === "admin123") {
        // Store admin session in localStorage
        localStorage.setItem(
          "admin_session",
          JSON.stringify({
            id: "admin-1",
            username: "admin",
            role: "admin",
            loginTime: new Date().toISOString(),
          }),
        )
        setSuccess("Admin login successful! Redirecting...")
        setTimeout(() => {
          router.push("/admin")
        }, 1000)
      } else {
        throw new Error("Invalid admin credentials. Use: admin / admin123")
      }
    } catch (error: any) {
      setError(error.message || "Admin login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Campus Placement Portal
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              MS Ramaiah University of Applied Sciences
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="student" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Student
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <Tabs defaultValue="login" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleStudentLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">College Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="22xxxxx@msruas.ac.in"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleStudentRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">College Email</Label>
                      <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        placeholder="22xxxxx@msruas.ac.in"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        Use your college email starting with '22' and ending with '@msruas.ac.in'
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username</Label>
                  <Input
                    id="admin-username"
                    name="username"
                    type="text"
                    placeholder="admin"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    placeholder="admin123"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Admin Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Demo Credentials:</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>
                <strong>Student:</strong> 22demo001@msruas.ac.in / password123
              </p>
              <p>
                <strong>Admin:</strong> admin / admin123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
