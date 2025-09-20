"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Briefcase, Calendar, TrendingUp, Users, FileText, Clock, CheckCircle, AlertCircle, IndianRupee, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
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
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      
      // For demo purposes, we'll use the actual student email from database
      // In real implementation, you'd get this from auth/session
      const studentEmail = "22etcs002132@msruas.ac.in"
      
      // Fetch student profile
      const profileResponse = await fetch(`/api/student/profile?email=${encodeURIComponent(studentEmail)}`)
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json()
        setStudentProfile(profileResult.data)
        
        // Calculate profile completion
        const profile = profileResult.data
        let completionScore = 0
        const totalFields = 10
        
        if (profile.first_name) completionScore++
        if (profile.college_email) completionScore++
        if (profile.personal_email) completionScore++
        if (profile.mobile_number) completionScore++
        if (profile.branch) completionScore++
        if (profile.college_reg_no) completionScore++
        if (profile.date_of_birth) completionScore++
        if (profile.ug_percentage) completionScore++
        if (profile.resume_url) completionScore++
        if (profile.placement_status) completionScore++
        
        const profileCompletion = Math.round((completionScore / totalFields) * 100)
        
        // Fetch applications
        const appsResponse = await fetch(`/api/student/applications?student_id=${profile.college_reg_no}`)
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
        const grievanceResponse = await fetch(`/api/grievance?student_reg_no=${encodeURIComponent(profileResult.data.reg_no)}`)
        if (grievanceResponse.ok) {
          const grievanceData = await grievanceResponse.json()
          setGrievances(grievanceData.slice(0, 3)) // Show only latest 3
        }
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
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

  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Track your placement journey and manage your applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground">Currently in process</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
              <p className="text-xs text-muted-foreground">Scheduled this week</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
              <p className="text-xs text-muted-foreground">Congratulations!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Applications
                </CardTitle>
                <CardDescription>Your latest job applications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-4 rounded-lg border bg-gray-50/50">
                        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {application.jobs?.company_name || 'Unknown Company'}
                            </h3>
                            <Badge className={getStatusColor(application.current_stage)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(application.current_stage)}
                                {formatStatus(application.current_stage)}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            {application.jobs?.title || 'Job Position'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Applied: {new Date(application.applied_at).toLocaleDateString()}</span>
                            {application.jobs?.application_deadline && (
                              <span>Deadline: {new Date(application.jobs.application_deadline).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/jobs/${application.job_id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No applications found</p>
                    <p className="text-sm">Start by browsing available jobs</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.push('/jobs')}
                    >
                      Browse Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Completion */}
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to increase visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile Strength</span>
                    <span className="font-medium">{stats.profileCompletion}%</span>
                  </div>
                  <Progress value={stats.profileCompletion} className="h-2" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Basic Information</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resume Uploaded</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Academic Details</span>
                  </div>
                </div>
                {stats.profileCompletion === 100 ? (
                  <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Profile Completed!</span>
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    onClick={() => router.push("/profile")}
                  >
                    Complete Profile ({stats.profileCompletion}%)
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/jobs")}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/applications")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Track Applications
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/profile")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Update Resume
                </Button>
              </CardContent>
            </Card>

            {/* Grievance Tracking */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Grievances
                </CardTitle>
                <CardDescription>Track your submitted grievances and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse p-3 rounded-lg border bg-gray-50/50">
                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : grievances.length > 0 ? (
                  <div className="space-y-3">
                    {grievances.map((grievance) => (
                      <div
                        key={grievance.id}
                        className="p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-700/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {grievance.issue_type}
                          </h4>
                          <Badge className={getGrievanceStatusColor(grievance.status)} variant="outline">
                            {formatGrievanceStatus(grievance.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                          {grievance.message}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(grievance.created_at).toLocaleDateString()}
                        </div>
                        {grievance.admin_response && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                              <span className="font-medium">Admin Response:</span> {grievance.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No grievances submitted</p>
                    <Button 
                      size="sm" 
                      className="mt-3" 
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
                    className="w-full mt-3"
                    onClick={() => router.push('/grievance')}
                  >
                    View All Grievances
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
