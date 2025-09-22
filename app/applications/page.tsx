"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import type { ApplicationStatus, StudentDetails } from "@/lib/supabase"
import { Clock, CheckCircle, XCircle, Calendar, Building, FileText, AlertCircle, Users, Briefcase, IndianRupee } from "lucide-react"

interface ApplicationWithDetails extends ApplicationStatus {
  job_title?: string
  company_logo?: string
  package_range?: string
  rounds?: ApplicationRound[]
  current_round?: ApplicationRound
}

interface ApplicationRound {
  id: string
  round_number: number
  round_name: string
  round_type: string
  status: string
  scheduled_at?: string
  completed_at?: string
  feedback?: string
  score?: number
}

export default function ApplicationsPage() {
  const { student, isLoading: authLoading } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
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
    if (!authLoading && student) {
      fetchData()
    } else if (!authLoading && !student) {
      router.push('/')
    }
  }, [authLoading, student])

  const fetchData = async () => {
    try {
      // Check if student is authenticated via auth context
      if (!student) {
        router.push('/profile')
        return
      }

      // Fetch real application data from API
      const response = await fetch(`/api/student/applications?student_id=${student.college_reg_no}`)
      let applicationsData = []
      
      if (response.ok) {
        const data = await response.json()
        applicationsData = data.data || []
        console.log('API returned applications:', applicationsData.length)
      } else {
        console.log('Applications API failed')
      }
      
      // Transform API data to match the expected format and fetch round data
      const applicationsWithDetails: ApplicationWithDetails[] = await Promise.all(
        applicationsData.map(async (app: any) => {
          const baseApp = {
            id: app.id,
            student_reg_no: app.student_reg_no,
            job_id: app.job_id,
            company_name: app.company_name,
            job_title: app.jobs?.title || 'Unknown Job',
            company_logo: "/placeholder.svg?height=40&width=40",
            package_range: app.jobs ? `${(app.jobs.package_max / 100000).toFixed(1)}L` : 'Not specified',
            current_stage: app.current_stage,
            stage_history: [
              { 
                stage: "applied", 
                timestamp: app.applied_at, 
                description: "Application submitted successfully" 
              },
              // Add more stage history based on status
              ...(app.current_stage !== 'applied' ? [{
                stage: app.current_stage,
                timestamp: app.updated_at,
                description: getStatusDescription(app.current_stage)
              }] : [])
            ],
            applied_at: app.applied_at,
            updated_at: app.updated_at,
            rounds: [],
            current_round: undefined
          }

          // Fetch round data for this application
          try {
            const roundsResponse = await fetch(`/api/student/application-rounds?student_id=${student.college_reg_no}&application_id=${app.id}`)
            if (roundsResponse.ok) {
              const roundsData = await roundsResponse.json()
              const appRounds = roundsData.applications?.[app.id]?.rounds || []
              
              baseApp.rounds = appRounds
              // Find current round (first non-completed round or last round)
              const currentRound = appRounds.find((r: ApplicationRound) => 
                ['in_progress', 'scheduled', 'pending'].includes(r.status)
              ) || appRounds[appRounds.length - 1]
              
              baseApp.current_round = currentRound
            }
          } catch (roundError) {
            console.error(`Error fetching rounds for application ${app.id}:`, roundError)
          }

          return baseApp
        })
      )

      setApplications(applicationsWithDetails)

      // Calculate stats from real data - improved mapping
      const stats = {
        total: applicationsWithDetails.length,
        pending: applicationsWithDetails.filter(app => 
          ['applied', 'under_review', 'shortlisted'].includes(app.current_stage)
        ).length,
        interviews: applicationsWithDetails.filter(app => 
          ['interview', 'interview_scheduled', 'scheduled'].includes(app.current_stage) || 
          (app.current_round && ['scheduled', 'in_progress'].includes(app.current_round.status))
        ).length,
        selected: applicationsWithDetails.filter(app => 
          ['selected', 'placed', 'offered'].includes(app.current_stage)
        ).length,
        rejected: applicationsWithDetails.filter(app => 
          ['rejected', 'withdrawn'].includes(app.current_stage)
        ).length,
      }
      
      console.log('Application stats calculated:', stats)
      console.log('Sample applications:', applicationsWithDetails.slice(0, 3).map(app => ({
        stage: app.current_stage,
        round: app.current_round?.status
      })))
      
      setStats(stats)

    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get status descriptions
  const getStatusDescription = (status: string): string => {
    const descriptions: Record<string, string> = {
      'applied': 'Application submitted successfully',
      'under_review': 'Application under review by HR team',
      'shortlisted': 'Shortlisted for next round',
      'interview': 'Interview scheduled',
      'selected': 'Congratulations! You have been selected',
      'rejected': 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
      'withdrawn': 'Application withdrawn by student'
    }
    return descriptions[status] || 'Status updated'
  }

  // Helper function to get round status colors
  const getRoundStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'passed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'scheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'completed': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'no_show': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Helper function to get round status icon
  const getRoundStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'scheduled': return <Calendar className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
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
    
    // Show 100% completion for final statuses
    if (stage === "rejected" || stage === "placed" || stage === "selected") return 100
    
    // For ongoing stages, calculate progress
    if (currentIndex >= 0) {
      return ((currentIndex + 1) / stages.length) * 100
    }
    
    // Default progress for unknown stages
    return 25
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString("en-IN", {
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
        <CardHeader className="pb-4 sm:pb-6">
          {/* Mobile: Stacked layout, Desktop: Side-by-side */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">{application.job_title}</CardTitle>
                <CardDescription className="font-medium text-sm sm:text-base truncate">{application.company_name}</CardDescription>
                {application.package_range && (
                  <div className="flex items-center gap-1 mt-1">
                    <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <p className="text-xs sm:text-sm text-green-600 font-medium">{application.package_range}</p>
                  </div>
                )}
              </div>
            </div>
            <Badge className={`${getStageColor(application.current_stage)} flex-shrink-0 text-xs px-2 py-1 ml-auto sm:text-sm sm:px-3 sm:py-1.5`}>
              <div className="flex items-center gap-1">
                {getStageIcon(application.current_stage)}
                <span className="hidden sm:inline">{getStageLabel(application.current_stage)}</span>
                <span className="sm:hidden text-xs">{getStageLabel(application.current_stage).split(' ')[0]}</span>
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Application Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-medium text-xs sm:text-sm">Timeline</h4>
            <div className="space-y-1.5 sm:space-y-2">
              {application.stage_history.slice(-3).map((stage, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${
                      index === application.stage_history.slice(-3).length - 1 ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{getStageLabel(stage.stage)}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(stage.timestamp)}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 leading-relaxed">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Round Status */}
          {application.current_round && (
            <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
              <h4 className="font-medium text-xs sm:text-sm">Current Round</h4>
              <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {getRoundStatusIcon(application.current_round.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">
                        Round {application.current_round.round_number}: {application.current_round.round_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                        {application.current_round.round_type}
                      </p>
                      {application.current_round.scheduled_at && (
                        <p className="text-xs text-blue-600 mt-1">
                          Scheduled: {new Date(application.current_round.scheduled_at).toLocaleString()}
                        </p>
                      )}
                      {application.current_round.score && (
                        <p className="text-xs text-green-600 mt-1">
                          Score: {application.current_round.score}/100
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getRoundStatusColor(application.current_round.status)} text-xs flex-shrink-0`}>
                    <span className="hidden sm:inline">{application.current_round.status.replace('_', ' ')}</span>
                    <span className="sm:hidden">{application.current_round.status.split('_')[0]}</span>
                  </Badge>
                </div>
              </div>
              {application.current_round.feedback && (
                <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Feedback</p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{application.current_round.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Round Progress Overview */}
          {application.rounds && application.rounds.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h4 className="font-medium text-xs sm:text-sm">Round Progress</h4>
              <div className="flex gap-1">
                {application.rounds.map((round, index) => (
                  <div
                    key={round.id}
                    className={`flex-1 h-1.5 sm:h-2 rounded-full ${
                      round.status === 'passed' 
                        ? 'bg-green-500' 
                        : round.status === 'failed' 
                        ? 'bg-red-500'
                        : round.status === 'in_progress' || round.status === 'scheduled'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                    title={`${round.round_name}: ${round.status}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Round 1</span>
                <span>Round {application.rounds.length}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 sm:pt-4 border-t gap-2">
            <div className="text-xs sm:text-sm text-gray-500">Applied: {formatDate(application.applied_at)}</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/jobs/${application.job_id}`)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="h-6 sm:h-8 bg-gray-300 rounded w-40 sm:w-48 mb-2 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-300 rounded w-48 sm:w-64 animate-pulse"></div>
          </div>
          
          {/* Stats cards loading */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 p-3 sm:p-6 rounded-lg shadow animate-pulse">
                <div className="h-3 sm:h-4 bg-gray-300 rounded w-12 sm:w-16 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-300 rounded w-6 sm:w-8 mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-300 rounded w-8 sm:w-12 sm:hidden"></div>
              </div>
            ))}
          </div>
          
          {/* Application cards loading */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow p-4 sm:p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-3 sm:h-4 bg-gray-300 rounded w-24 sm:w-32 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-300 rounded w-16 sm:w-24"></div>
                  </div>
                  <div className="h-4 sm:h-6 bg-gray-300 rounded-full w-12 sm:w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 sm:h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-center sm:text-left">
            Track Applications
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center sm:text-left">Monitor the status of your job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                <span className="truncate">Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1 sm:hidden">Applications</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                <span className="truncate">Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-gray-500 mt-1 sm:hidden">Pending</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg col-span-2 sm:col-span-1">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                <span className="truncate">Scheduled</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.interviews}</div>
              <div className="text-xs text-gray-500 mt-1 sm:hidden">Interviews</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="truncate">Success</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.selected}</div>
              <div className="text-xs text-gray-500 mt-1 sm:hidden">Selected</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                <span className="truncate">Rejected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-gray-500 mt-1 sm:hidden">Closed</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4 sm:space-y-6">
          {applications.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center py-8 sm:py-12">
                <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Applications Yet</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">
                  You haven't applied to any jobs yet. Start exploring opportunities!
                </p>
                <Button
                  onClick={() => router.push("/jobs")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
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
