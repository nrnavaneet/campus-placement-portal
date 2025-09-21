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
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, GraduationCap, Shield } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const router = useRouter()
  const { login, resetPassword } = useAuth()

  const validateStudentEmail = (email: string) => {
    // Format: 22[any letters][any numbers]@msruas.ac.in
    // Examples: 22cs123456@msruas.ac.in, 22etcsxxxxxx@msruas.ac.in, 22mech987654@msruas.ac.in
    const regex = /^22[a-zA-Z]+[0-9]+@msruas\.ac\.in$/
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
      setError("Please use your college email (format: 22etcs002132@msruas.ac.in)")
      setIsLoading(false)
      return
    }

    try {
      // Use auth context login function which properly loads student data
      const success = await login(email, password)
      
      if (success) {
        // Login successful and student data loaded
        router.push("/dashboard")
      } else {
        // Check if it's a registration issue
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            if (error.message.includes("Invalid login credentials")) {
              throw new Error("User doesn't exist, please register first")
            }
            throw error
          }

          // If auth succeeds but login() failed, it means no student profile
          if (data.user) {
            setError("Please complete your registration first")
            setTimeout(() => {
              router.push("/register")
            }, 2000)
          }
        } catch (authError: any) {
          if (authError.message.includes("Invalid login credentials")) {
            setError("User doesn't exist, please register first")
          } else {
            setError(authError.message || "Login failed. Please try again.")
          }
        }
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
      setError("Please use your college email (format: 22etcs002132@msruas.ac.in)")
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
          // Email already confirmed
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

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!validateStudentEmail(resetEmail)) {
      setError("Please use your college email (format: 22etcs002132@msruas.ac.in)")
      setIsLoading(false)
      return
    }

    try {
      const success = await resetPassword(resetEmail)
      if (success) {
        setSuccess("Password reset link sent to your email. Please check your inbox.")
        setShowForgotPassword(false)
        setResetEmail("")
      } else {
        setError("Failed to send reset email. Please try again.")
      }
    } catch (error: any) {
      setError(error.message || "Failed to send reset email. Please try again.")
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
      // Call admin authentication API
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      if (result.success && result.admin) {
        // Store admin session
        localStorage.setItem(
          "admin_session",
          JSON.stringify({
            id: result.admin.id,
            username: result.admin.username,
            email: result.admin.email,
            role: result.admin.role || "admin",
            loginTime: new Date().toISOString(),
          }),
        )
        
        setSuccess("Admin login successful! Redirecting...")
        setTimeout(() => {
          router.push("/admin")
        }, 1000)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error: any) {
      setError(error.message || "Admin login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
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
                  <TabsTrigger value="register">Verify & Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  {!showForgotPassword ? (
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">College Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="22etcsxxxxxx@msruas.ac.in"
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
                      
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot Password?
                        </Button>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">College Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="22etcsxxxxxx@msruas.ac.in"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">
                          Enter your college email to receive a password reset link
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowForgotPassword(false)
                            setResetEmail("")
                            setError("")
                            setSuccess("")
                          }}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          disabled={isLoading}
                        >
                          {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleStudentRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">College Email</Label>
                      <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        placeholder="22etcsxxxxxx@msruas.ac.in"
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
        </CardContent>
      </Card>
    </div>
  )
}
