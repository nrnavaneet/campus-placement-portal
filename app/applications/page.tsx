"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ApplicationStatus, StudentDetails } from "@/lib/supabase"
import { Clock, CheckCircle, XCircle, Calendar, Building, FileText, AlertCircle, Users, Briefcase } from "lucide-react"

interface ApplicationWithDetails extends ApplicationStatus {
  job_title?: string
  company_logo?: string
  package_range?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviews: 0,
    selected: 0,
    rejected: 0,
  })
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get student profile
      const storedProfile = localStorage.getItem("student_profile")
      if (storedProfile) {
        setStudent(JSON.parse(storedProfile))
      }

      // Mock application data for demo
      const mockApplications: ApplicationWithDetails[] = [
        {
          id: "app-1",
          student_reg_no: "22DEMO001",
          job_id: "job-1",
          company_name: "TechCorp Solutions",
          job_title: "Software Developer",
          company_logo: "/placeholder.svg?height=40&width=40",
          package_range: "₹6L - ₹12L",
          current_stage: "interview_scheduled",
          stage_history: [
            { stage: "applied", timestamp: "2024-01-15T10:00:00Z", description: "Application submitted successfully" },
            {
              stage: "under_review",
              timestamp: "2024-01-18T14:30:00Z",
              description: "Application under review by HR team",
            },
            {
              stage: "shortlisted",
              timestamp: "2024-01-22T09:15:00Z",
              description: "Shortlisted for technical assessment",
            },
            {
              stage: "interview_scheduled",
              timestamp: "2024-01-25T16:45:00Z",
              description: "Technical interview scheduled for Feb 2, 2024",
            },
          ],
          applied_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-25T16:45:00Z",
        },
        {
          id: "app-2",
          student_reg_no: "22DEMO001",
          job_id: "job-2",
          company_name: "DataViz Inc",
          job_title: "Data Analyst Intern",
          company_logo: "/placeholder.svg?height=40&width=40",
          package_range: "₹25K - ₹40K",
          current_stage: "under_review",
          stage_history: [
            { stage: "applied", timestamp: "2024-01-20T11:30:00Z", description: "Application submitted successfully" },
            { stage: "under_review", timestamp: "2024-01-22T15:20:00Z", description: "Application under review" },
          ],
          applied_at: "2024-01-20T11:30:00Z",
          updated_at: "2024-01-22T15:20:00Z",
        },
        {
          id: "app-3",
          student_reg_no: "22DEMO001",
          job_id: "job-3",
          company_name: "InnovateTech",
          job_title: "Frontend Developer",
          company_logo: "/placeholder.svg?height=40&width=40",
          package_range: "₹5L - ₹9L",
          current_stage: "selected",
          stage_history: [
            { stage: "applied", timestamp: "2024-01-10T09:00:00Z", description: "Application submitted successfully" },
            { stage: "under_review", timestamp: "2024-01-12T10:30:00Z", description: "Portfolio review in progress" },
            {
              stage: "shortlisted",
              timestamp: "2024-01-15T14:15:00Z",
              description: "Shortlisted for technical interview",
            },
            {
              stage: "interview_scheduled",
              timestamp: "2024-01-18T11:00:00Z",
              description: "Technical interview completed",
            },
            {
              stage: "selected",
              timestamp: "2024-01-25T17:30:00Z",
              description: "Congratulations! You have been selected",
            },
          ],
          applied_at: "2024-01-10T09:00:00Z",
          updated_at: "2024-01-25T17:30:00Z",
        },
        {
          id: "app-4",
          student_reg_no: "22DEMO001",
          job_id: "job-4",
          company_name: "StartupXYZ",
          job_title: "Full Stack Developer",
          company_logo: "/placeholder.svg?height=40&width=40",
          package_range: "₹4L - ₹8L",
          current_stage: "rejected",
          stage_history: [
            { stage: "applied", timestamp: "2024-01-05T08:30:00Z", description: "Application submitted successfully" },
            { stage: "under_review", timestamp: "2024-01-08T12:00:00Z", description: "Application under review" },
            {
              stage: "rejected",
              timestamp: "2024-01-12T16:20:00Z",
              description: "Thank you for your interest. We have decided to move forward with other candidates.",
            },
          ],
          applied_at: "2024-01-05T08:30:00Z",
          updated_at: "2024-01-12T16:20:00Z",
        },
      ]

      setApplications(mockApplications)

      // Calculate stats
      const stats = {
        total: mockApplications.length,
        pending: mockApplications.filter((app) => ["applied", "under_review"].includes(app.current_stage)).length,
        interviews: mockApplications.filter((app) => app.current_stage === "interview_scheduled").length,
        selected: mockApplications.filter((app) => app.current_stage === "selected").length,
        rejected: mockApplications.filter((app) => app.current_stage === "rejected").length,
      }
      setStats(stats)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "under_review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "shortlisted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "interview_scheduled":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "selected":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "applied":
        return <FileText className="w-4 h-4" />
      case "under_review":
        return <Clock className="w-4 h-4" />
      case "shortlisted":
        return <Users className="w-4 h-4" />
      case "interview_scheduled":
        return <Calendar className="w-4 h-4" />
      case "selected":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "applied":
        return "Applied"
      case "under_review":
        return "Under Review"
      case "shortlisted":
        return "Shortlisted"
      case "interview_scheduled":
        return "Interview Scheduled"
      case "selected":
        return "Selected"
      case "rejected":
        return "Rejected"
      default:
        return stage
    }
  }

  const getStageProgress = (stage: string) => {
    const stages = ["applied", "under_review", "shortlisted", "interview_scheduled", "selected"]
    const currentIndex = stages.indexOf(stage)
    if (stage === "rejected") return 25 // Show minimal progress for rejected
    return ((currentIndex + 1) / stages.length) * 100
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ApplicationCard = ({ application }: { application: ApplicationWithDetails }) => {
    const progress = getStageProgress(application.current_stage)
    const latestUpdate = application.stage_history[application.stage_history.length - 1]

    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{application.job_title}</CardTitle>
                <CardDescription className="font-medium">{application.company_name}</CardDescription>
                {application.package_range && (
                  <p className="text-sm text-green-600 font-medium">{application.package_range}</p>
                )}
              </div>
            </div>
            <Badge className={getStageColor(application.current_stage)}>
              <div className="flex items-center gap-1">
                {getStageIcon(application.current_stage)}
                {getStageLabel(application.current_stage)}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Application Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Timeline</h4>
            <div className="space-y-2">
              {application.stage_history.slice(-3).map((stage, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      index === application.stage_history.slice(-3).length - 1 ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getStageLabel(stage.stage)}</span>
                      <span className="text-xs text-gray-500">{formatDate(stage.timestamp)}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">Applied: {formatDate(application.applied_at)}</div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/applications/${application.id}`)}>
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading applications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Track Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor the status of your job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.interviews}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Applications Yet</h3>
                <p className="text-gray-500 mb-4">
                  You haven't applied to any jobs yet. Start exploring opportunities!
                </p>
                <Button
                  onClick={() => router.push("/jobs")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
