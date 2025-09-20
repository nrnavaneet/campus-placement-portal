"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/contexts/theme-context"
import { useAuth } from "@/contexts/auth-context"
import { supabaseClient } from "@/lib/supabase"
import { toast } from "sonner"
import {
  SettingsIcon,
  Bell,
  Shield,
  Moon,
  Sun,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Lock,
} from "lucide-react"

export default function SettingsPage() {
  const { student, updatePassword } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [settings, setSettings] = useState({
    newOpportunities: true,
    applicationStatusUpdates: true,
    placementCongratulations: true,
    deadlineReminders: true,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    if (!student) {
      toast.error("Please log in to access settings")
      router.push("/")
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/student/settings?email=${encodeURIComponent(student.college_email || student.personal_email)}`)
      if (response.ok) {
        const result = await response.json()
        setSettings(result.data)
      } else {
        console.error('Failed to load settings')
        toast.error("Failed to load settings")
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error("Error loading settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = async (key: string, value: boolean) => {
    if (!student) {
      toast.error("Please log in to change settings")
      return
    }

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    try {
      // Save to API
      const studentEmail = student.college_email || student.personal_email
      
      const response = await fetch('/api/student/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentEmail,
          settings: newSettings
        }),
      })
      
      if (response.ok) {
        setSuccess('Settings updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to save settings')
        // Revert the change
        setSettings({ ...newSettings, [key]: !value })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError('Failed to save settings')
      // Revert the change
      setSettings({ ...newSettings, [key]: !value })
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Please fill in all password fields")
      setPasswordSuccess("")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match")
      setPasswordSuccess("")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long")
      setPasswordSuccess("")
      return
    }

    setIsLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    try {
      // Use the auth context to update password
      const success = await updatePassword(passwordData.currentPassword, passwordData.newPassword)
      
      if (success) {
        setPasswordSuccess("Password updated successfully!")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        toast.success("Password updated successfully!")
      } else {
        setPasswordError("Current password is incorrect or update failed")
        toast.error("Failed to update password")
      }
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password")
      toast.error("Failed to update password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")

    if (!confirmed) return

    setIsLoading(true)
    try {
      // For demo purposes, just clear data and redirect
      localStorage.clear()
      await supabaseClient.auth.signOut()
      router.push("/")
    } catch (error) {
      setError("Failed to delete account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and privacy settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Settings Menu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Privacy
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  {theme === "light" ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                  Appearance
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notifications */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to be notified about updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">New Opportunities</Label>
                    <p className="text-sm text-gray-500">Get notified when new job opportunities are posted</p>
                  </div>
                  <Switch
                    checked={settings.newOpportunities}
                    onCheckedChange={(checked) => handleSettingChange("newOpportunities", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Application Status Updates</Label>
                    <p className="text-sm text-gray-500">Get notified when your application status changes (selected, shortlisted, etc.)</p>
                  </div>
                  <Switch
                    checked={settings.applicationStatusUpdates}
                    onCheckedChange={(checked) => handleSettingChange("applicationStatusUpdates", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Placement Congratulations</Label>
                    <p className="text-sm text-gray-500">Receive congratulatory messages when you get placed</p>
                  </div>
                  <Switch
                    checked={settings.placementCongratulations}
                    onCheckedChange={(checked) => handleSettingChange("placementCongratulations", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Deadline Reminders</Label>
                    <p className="text-sm text-gray-500">Remind me about upcoming application deadlines</p>
                  </div>
                  <Switch
                    checked={settings.deadlineReminders}
                    onCheckedChange={(checked) => handleSettingChange("deadlineReminders", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>

                  {/* Password-specific status messages */}
                  {passwordError && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800 dark:text-red-200">{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-800 dark:text-green-200">{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {theme === "light" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Manage your personal data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-0.5">
                      <Label className="text-base text-red-600">Danger Zone</Label>
                      <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
                    </div>

                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm">Permanently delete your account and all associated data</p>
                          </div>
                          <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isLoading}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Messages */}
            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
