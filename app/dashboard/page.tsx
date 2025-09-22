"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Briefcase, Calendar, TrendingUp, Users, FileText, Clock, CheckCircle, AlertCircle, IndianRupee, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function DashboardPage() {
  const { student, isLoading } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeApplications: 0,
    interviews: 0,
    offers: 0,
    profileCompletion: 0,
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [grievances, setGrievances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [studentProfile, setStudentProfile] = useState<any>(null)

  useEffect(() => {
    // Wait for auth context to finish loading before checking authentication
    if (isLoading) return
    
    if (!student) {
      toast.error("Please log in to access the dashboard")
      router.push("/")
      return
    }
    fetchStudentData()
  }, [student, isLoading, router])

  const fetchStudentData = async () => {
    if (!student) return

    try {
      setLoading(true)
      setStudentProfile(student)
      
      // Calculate profile completion
      let completionScore = 0
      const totalFields = 10
      
      if (student.first_name) completionScore++
      if (student.college_email) completionScore++
      if (student.personal_email) completionScore++
      if (student.mobile_number) completionScore++
      if (student.branch) completionScore++
      if (student.college_reg_no) completionScore++
      if (student.date_of_birth) completionScore++
      if (student.ug_percentage) completionScore++
      if (student.resume_url) completionScore++
      if (student.placement_status) completionScore++
      
      const profileCompletion = Math.round((completionScore / totalFields) * 100)
      
      // Fetch applications
      const appsResponse = await fetch(`/api/student/applications?student_id=${student.college_reg_no}`)
      let applicationsData = []
      let applicationStats = {
        totalApplications: 0,
        activeApplications: 0,
        interviews: 0,
        offers: 0,
        placed: 0
      }

      if (appsResponse.ok) {
        const appsResult = await appsResponse.json()
        applicationsData = appsResult.data || []
        applicationStats = appsResult.stats
        console.log('Dashboard API returned applications:', applicationsData?.length || 0)
      } else {
        console.log('Applications API failed for dashboard')
      }

      setRecentApplications(applicationsData)
      setStats({
        ...applicationStats,
        profileCompletion
      })

      // Fetch student grievances
      const grievanceResponse = await fetch(`/api/grievance?student_reg_no=${encodeURIComponent(student.college_reg_no)}`)
      if (grievanceResponse.ok) {
        const grievanceData = await grievanceResponse.json()
        setGrievances(grievanceData.slice(0, 3)) // Show only latest 3
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed":
      case "selected":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "interview":
      case "interview_scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "under_review":
      case "applied":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "offered":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed":
      case "selected":
        return <CheckCircle className="w-3 h-3" />
      case "interview":
      case "interview_scheduled":
        return <AlertCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getGrievanceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "submitted":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  const formatGrievanceStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed":
        return "Placed"
      case "interview":
        return "Interview Scheduled"
      case "under_review":
        return "Under Review"
      case "applied":
        return "Applied"
      case "offered":
        return "Offer Received"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-center sm:text-left">
            Welcome to Your Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center sm:text-left">Track your placement journey and manage your applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">In process</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Interviews</CardTitle>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.interviews}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Shortlisted</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Offers</CardTitle>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.offers}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Success!</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Completion */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Profile Completion</CardTitle>
              <CardDescription className="text-sm">Complete your profile to increase visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>Profile Strength</span>
                  <span className="font-medium">{stats.profileCompletion}%</span>
                </div>
                <Progress value={stats.profileCompletion} className="h-1.5 sm:h-2" />
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Basic Information</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Resume Uploaded</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Academic Details</span>
                </div>
              </div>
              {stats.profileCompletion === 100 ? (
                <div className="flex items-center gap-2 text-green-600 p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-xs sm:text-sm">Profile Completed!</span>
                </div>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-xs sm:text-sm"
                  onClick={() => router.push("/profile")}
                >
                  Complete Profile ({stats.profileCompletion}%)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => router.push("/jobs")}
              >
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Browse Jobs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => router.push("/applications")}
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Track Applications
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => router.push("/profile")}
              >
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Update Resume
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Applications
              </CardTitle>
              <CardDescription className="text-sm">Your latest job applications and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 sm:p-4 rounded-lg border bg-gray-50/50">
                      <div className="h-3 sm:h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                      <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : recentApplications.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="p-3 sm:p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="space-y-2 sm:space-y-0">
                        {/* Mobile: Stack everything vertically, Desktop: Side by side */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                                {application.jobs?.company_name || 'Unknown Company'}
                              </h3>
                              <Badge className={`${getStatusColor(application.current_stage)} w-fit`}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(application.current_stage)}
                                  <span className="text-xs">{formatStatus(application.current_stage)}</span>
                                </div>
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">
                              {application.jobs?.title || 'Job Position'}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
                              {application.jobs?.application_deadline && (
                                <span className="hidden sm:inline">Deadline: {new Date(application.jobs.application_deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/jobs/${application.job_id}`)}
                            className="text-xs sm:text-sm w-full sm:w-auto mt-2 sm:mt-0"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No applications found</p>
                  <p className="text-xs sm:text-sm">Start by browsing available jobs</p>
                  <Button 
                    className="mt-3 sm:mt-4 w-full sm:w-auto text-sm" 
                    onClick={() => router.push('/jobs')}
                  >
                    Browse Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Grievances */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                Recent Grievances
              </CardTitle>
              <CardDescription className="text-sm">Track your submitted grievances and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse p-2.5 sm:p-3 rounded-lg border bg-gray-50/50">
                      <div className="h-2.5 sm:h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : grievances.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto pr-2">
                  {grievances.map((grievance) => (
                    <div
                      key={grievance.id}
                      className="p-2.5 sm:p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h4 className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                          {grievance.issue_type}
                        </h4>
                        <Badge className={`${getGrievanceStatusColor(grievance.status)} w-fit text-xs`} variant="outline">
                          {formatGrievanceStatus(grievance.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 leading-relaxed">
                        {grievance.message}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(grievance.created_at).toLocaleDateString()}
                      </div>
                      {grievance.admin_response && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                            <span className="font-medium">Admin Response:</span> {grievance.admin_response}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 sm:py-4 text-gray-500">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">No grievances submitted</p>
                  <Button 
                    size="sm" 
                    className="mt-2 sm:mt-3 text-xs sm:text-sm w-full sm:w-auto" 
                    onClick={() => router.push('/grievance')}
                  >
                    Submit Grievance
                  </Button>
                </div>
              )}
              {grievances.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 sm:mt-3 text-xs sm:text-sm"
                  onClick={() => router.push('/grievance')}
                >
                  View All Grievances
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer variant="student" />
    </div>
  )
}
