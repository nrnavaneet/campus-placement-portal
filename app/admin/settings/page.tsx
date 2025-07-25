"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Users, Briefcase, Mail, Shield, Save, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

interface SystemSettings {
  applicationSettings: {
    registrationEnabled: boolean
    jobApplicationsEnabled: boolean
    maxApplicationsPerStudent: number
    requireResumeForApplication: boolean
  }
  emailSettings: {
    notificationsEnabled: boolean
    adminEmail: string
    smtpConfigured: boolean
  }
  systemInfo: {
    totalStudents: number
    totalJobs: number
    totalApplications: number
    lastBackup: string
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    applicationSettings: {
      registrationEnabled: true,
      jobApplicationsEnabled: true,
      maxApplicationsPerStudent: 5,
      requireResumeForApplication: true,
    },
    emailSettings: {
      notificationsEnabled: true,
      adminEmail: "admin@msruas.ac.in",
      smtpConfigured: false,
    },
    systemInfo: {
      totalStudents: 0,
      totalJobs: 0,
      totalApplications: 0,
      lastBackup: "Never",
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadSettings()
    loadSystemInfo()
  }, [])

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("admin_settings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const loadSystemInfo = () => {
    try {
      const students = JSON.parse(localStorage.getItem("all_students") || "[]")
      const jobs = JSON.parse(localStorage.getItem("all_jobs") || "[]")
      const applications = JSON.parse(localStorage.getItem("all_applications") || "[]")

      setSettings(prev => ({
        ...prev,
        systemInfo: {
          totalStudents: students.length,
          totalJobs: jobs.length + 3, // Include mock jobs
          totalApplications: applications.length,
          lastBackup: localStorage.getItem("last_backup") || "Never",
        },
      }))
    } catch (error) {
      console.error("Error loading system info:", error)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Save to localStorage
      localStorage.setItem("admin_settings", JSON.stringify(settings))
      
      // Update last backup time
      const now = new Date().toISOString()
      localStorage.setItem("last_backup", now)
      
      setSettings(prev => ({
        ...prev,
        systemInfo: {
          ...prev.systemInfo,
          lastBackup: now,
        },
      }))

      setSuccess("Settings saved successfully!")
    } catch (error: any) {
      setError(error.message || "Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupData = async () => {
    setIsLoading(true)
    try {
      const data = {
        students: JSON.parse(localStorage.getItem("all_students") || "[]"),
        jobs: JSON.parse(localStorage.getItem("all_jobs") || "[]"),
        applications: JSON.parse(localStorage.getItem("all_applications") || "[]"),
        settings: settings,
        timestamp: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `campus-portal-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toISOString()
      localStorage.setItem("last_backup", now)
      setSettings(prev => ({
        ...prev,
        systemInfo: {
          ...prev.systemInfo,
          lastBackup: now,
        },
      }))

      setSuccess("Data backup downloaded successfully!")
    } catch (error: any) {
      setError("Failed to create backup")
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Configure system settings and manage portal preferences
          </p>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="application" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="application" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Application</span>
              <span className="sm:hidden">App</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Email</span>
              <span className="sm:hidden">Mail</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">System</span>
              <span className="sm:hidden">Sys</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Application Settings
                </CardTitle>
                <CardDescription>Configure how the placement portal behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Student Registration</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow new students to register for the portal
                    </p>
                  </div>
                  <Switch
                    checked={settings.applicationSettings.registrationEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("applicationSettings", "registrationEnabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Job Applications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow students to apply for job postings
                    </p>
                  </div>
                  <Switch
                    checked={settings.applicationSettings.jobApplicationsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("applicationSettings", "jobApplicationsEnabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Require Resume for Applications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Students must upload resume before applying
                    </p>
                  </div>
                  <Switch
                    checked={settings.applicationSettings.requireResumeForApplication}
                    onCheckedChange={(checked) =>
                      updateSetting("applicationSettings", "requireResumeForApplication", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="maxApplications">Maximum Applications per Student</Label>
                  <Input
                    id="maxApplications"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.applicationSettings.maxApplicationsPerStudent}
                    onChange={(e) =>
                      updateSetting("applicationSettings", "maxApplicationsPerStudent", parseInt(e.target.value))
                    }
                    className="w-full sm:w-32"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Limit how many jobs a student can apply to
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Settings
                </CardTitle>
                <CardDescription>Configure email notifications and SMTP settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send automated emails for applications and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailSettings.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("emailSettings", "notificationsEnabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email Address</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.emailSettings.adminEmail}
                    onChange={(e) => updateSetting("emailSettings", "adminEmail", e.target.value)}
                    placeholder="admin@msruas.ac.in"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Primary email for system notifications
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">SMTP Configuration</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={settings.emailSettings.smtpConfigured ? "default" : "secondary"}>
                      {settings.emailSettings.smtpConfigured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure SMTP settings in environment variables
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Information
                </CardTitle>
                <CardDescription>View system statistics and manage data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{settings.systemInfo.totalStudents}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{settings.systemInfo.totalJobs}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{settings.systemInfo.totalApplications}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Applications</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Data Backup</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last backup: {settings.systemInfo.lastBackup === "Never" 
                          ? "Never" 
                          : new Date(settings.systemInfo.lastBackup).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={handleBackupData} disabled={isLoading} variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Refresh System Info</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Update statistics and counters
                      </p>
                    </div>
                    <Button onClick={loadSystemInfo} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-2">
                      <p className="font-medium">Security Features:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Supabase Row Level Security (RLS) enabled</li>
                        <li>JWT token-based authentication</li>
                        <li>Secure file upload with validation</li>
                        <li>Input sanitization and validation</li>
                        <li>HTTPS enforced in production</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Environment Variables</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_SUPABASE_PROJECT_ID:</span>
                        <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ? "default" : "destructive"}>
                          {process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ? "Set" : "Missing"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                        <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
