"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabaseClient, type Job, type StudentDetails, downloadResume } from "@/lib/supabase"
import {
  Briefcase,
  Calendar,
  Clock,
  IndianRupee,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  GraduationCap,
  RefreshCw,
  Eye,
  FileText,
  Download,
} from "lucide-react"

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentDetails | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)

  const router = useRouter()

  const [applicationData, setApplicationData] = useState<any[]>([])

  useEffect(() => {
    fetchJobs()
    fetchStudentProfile()
  }, [])

  useEffect(() => {
    if (studentProfile) {
      fetchApplicationData()
    }
  }, [studentProfile])

  useEffect(() => {
    filterJobs()
  }, [jobs, activeTab, studentProfile, applicationData])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/jobs')
      if (response.ok) {
        const result = await response.json()
        const jobsData = result.data || []
        // Update expired jobs before setting state
        const updatedJobs = updateExpiredJobs(jobsData)
        setJobs(updatedJobs)
      } else {
        setError('Failed to fetch jobs')
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProfile = async () => {
    try {
      // First try to get from localStorage like applications page
      const storedProfile = localStorage.getItem("student_profile")
      if (storedProfile) {
        const profileData = JSON.parse(storedProfile)
        // Ensure case consistency for matching applications
        if (profileData.college_reg_no) {
          profileData.college_reg_no = profileData.college_reg_no.toUpperCase()
        }
        setStudentProfile(profileData)
        return
      }
      
      // Fallback to API call if no stored profile
      const studentEmail = "22etcs002132@msruas.ac.in"
      
      const response = await fetch(`/api/student/profile?email=${encodeURIComponent(studentEmail)}`)
      if (response.ok) {
        const result = await response.json()
        // Make sure the college_reg_no is in the right case for matching applications
        if (result.data && result.data.college_reg_no) {
          result.data.college_reg_no = result.data.college_reg_no.toUpperCase()
        }
        setStudentProfile(result.data)
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
    }
  }

  const fetchApplicationData = async () => {
    if (!studentProfile?.college_reg_no) return
    
    try {
      const response = await fetch(`/api/student/applications?student_id=${studentProfile.college_reg_no}`)
      let applicationsData = []
      
      if (response.ok) {
        const result = await response.json()
        applicationsData = result.data || []
      }
      
      setApplicationData(applicationsData)
    } catch (error) {
      console.error('Error fetching application data:', error)
      setApplicationData([])
    }
  }

  const filterJobs = () => {
    if (!studentProfile) {
      setFilteredJobs(jobs.filter(job => job.status === "active" || job.status === "upcoming"))
      return
    }

    let filtered = jobs

    switch (activeTab) {
      case "eligible":
        // Get applied job IDs to exclude them from eligible jobs
        const appliedJobIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => 
          (job.status === "active" || job.status === "upcoming") &&
          isEligibleForJob(job, studentProfile) &&
          !appliedJobIds.includes(job.id) // Exclude applied jobs
        )
        break
      case "applied":
        // Show jobs that the student has applied to
        const studentAppliedJobIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => studentAppliedJobIds.includes(job.id))
        break
      case "deadline":
        // Get applied job IDs to exclude them from deadline jobs
        const deadlineAppliedJobIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => {
          if (!job.application_deadline) return false
          const deadline = new Date(job.application_deadline)
          const today = new Date()
          const diffTime = deadline.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays <= 7 && diffDays > 0 && 
                 (job.status === "active" || job.status === "upcoming") &&
                 !deadlineAppliedJobIds.includes(job.id) // Exclude applied jobs
        })
        break
      default:
        // All Jobs - exclude applied jobs
        const allJobsAppliedIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => 
          (job.status === "active" || job.status === "upcoming") &&
          !allJobsAppliedIds.includes(job.id) // Exclude applied jobs
        )
    }

    setFilteredJobs(filtered)
  }

  const isEligibleForJob = (job: Job, student: StudentDetails): boolean => {
    if (job.min_ug_percentage && student.ug_percentage < job.min_ug_percentage) {
      return false
    }

    if (job.no_backlogs_required && student.active_backlogs) {
      return false
    }

    if (job.branches_allowed && job.branches_allowed.length > 0) {
      if (!job.branches_allowed.includes(student.branch)) {
        return false
      }
    }

    return true
  }

  const updateExpiredJobs = (jobsList: Job[]): Job[] => {
    const now = new Date()
    return jobsList.map(job => {
      if (job.application_deadline && (job.status === 'active' || job.status === 'upcoming')) {
        const deadline = new Date(job.application_deadline)
        if (deadline < now) {
          return { ...job, status: 'closed' as const }
        }
      }
      return job
    })
  }

    // Download resume function

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Available Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover and apply for placement opportunities
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {applicationStatus && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{applicationStatus}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="eligible">Eligible</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
            <TabsTrigger value="deadline">Ending Soon</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-32"></div>
                            <div className="h-3 bg-gray-300 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-300 rounded w-full"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-300 rounded w-20"></div>
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-300 rounded flex-1"></div>
                          <div className="h-8 bg-gray-300 rounded flex-1"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => {
                  // Find application data for this job if we're on the applied tab
                  const application = activeTab === "applied" ? applicationData.find(app => app.job_id === job.id) : null
                  
                  return (
                    <Card
                      key={job.id}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                {job.title}
                              </CardTitle>
                              <CardDescription className="font-medium">
                                {job.company_name}
                              </CardDescription>
                            </div>
                          </div>
                          {/* Show application status badge for applied jobs, job status for others */}
                          {application ? (
                            <Badge
                              className={
                                application.current_stage === "applied"
                                  ? "bg-blue-100 text-blue-800"
                                  : application.current_stage === "under_review"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : application.current_stage === "shortlisted"
                                  ? "bg-purple-100 text-purple-800"
                                  : application.current_stage === "interview"
                                  ? "bg-orange-100 text-orange-800"
                                  : application.current_stage === "assessment"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : application.current_stage === "final_review"
                                  ? "bg-purple-100 text-purple-800"
                                  : application.current_stage === "selected"
                                  ? "bg-green-100 text-green-800"
                                  : application.current_stage === "offered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : application.current_stage === "placed"
                                  ? "bg-green-200 text-green-900"
                                  : application.current_stage === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : application.current_stage === "withdrawn"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {application.current_stage.charAt(0).toUpperCase() + application.current_stage.slice(1).replace('_', ' ')}
                            </Badge>
                          ) : (
                            <Badge
                              className={
                                job.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : job.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800"
                                  : job.status === "closed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {job.status === "closed" && job.application_deadline && new Date(job.application_deadline) < new Date() 
                                ? "Expired" 
                                : job.status}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {job.description}
                        </p>

                        {/* Eligibility Status - show for available jobs */}
                        {activeTab === "available" && studentProfile && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Eligibility:</span>
                              <span className={`font-medium ${isEligibleForJob(job, studentProfile) ? 'text-green-600' : 'text-red-600'}`}>
                                {isEligibleForJob(job, studentProfile) ? '✓ Eligible' : '✗ Not Eligible'}
                              </span>
                            </div>
                            {!isEligibleForJob(job, studentProfile) && (
                              <div className="mt-2 text-xs text-gray-500">
                                {job.min_ug_percentage && studentProfile.ug_percentage < job.min_ug_percentage && (
                                  <div>• UG percentage: Need {job.min_ug_percentage}%, have {studentProfile.ug_percentage}%</div>
                                )}
                                {job.no_backlogs_required && studentProfile.active_backlogs && (
                                  <div>• Active backlogs not allowed</div>
                                )}
                                {job.branches_allowed && job.branches_allowed.length > 0 && !job.branches_allowed.includes(studentProfile.branch) && (
                                  <div>• Branch not eligible: {studentProfile.branch}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Application Details - show only for applied jobs */}
                        {application && activeTab === "applied" && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Applied on:</span>
                              <span className="font-medium">
                                {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            {application.updated_at && application.updated_at !== application.applied_at && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Last updated:</span>
                                <span className="font-medium">
                                  {new Date(application.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Current Status:</span>
                              <div className="flex items-center space-x-1">
                                {application.current_stage === "applied" ? (
                                  <Clock className="w-4 h-4 text-blue-600" />
                                ) : application.current_stage === "under_review" ? (
                                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                                ) : application.current_stage === "selected" || application.current_stage === "placed" || application.current_stage === "offered" ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : application.current_stage === "rejected" ? (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {application.current_stage.charAt(0).toUpperCase() + application.current_stage.slice(1).replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            {/* Status description */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {application.current_stage === "applied" && "Application received and being processed"}
                              {application.current_stage === "under_review" && "Application is being reviewed by recruiters"}
                              {application.current_stage === "shortlisted" && "Congratulations! You have been shortlisted"}
                              {application.current_stage === "interview" && "Interview rounds in progress"}
                              {application.current_stage === "assessment" && "Technical/skill assessment in progress"}
                              {application.current_stage === "final_review" && "Final evaluation in progress"}
                              {application.current_stage === "selected" && "🎉 Selected! Waiting for offer details"}
                              {application.current_stage === "offered" && "🎉 Job offer received! Review and accept"}
                              {application.current_stage === "placed" && "🌟 Congratulations! Successfully placed"}
                              {application.current_stage === "rejected" && "Application not selected this time"}
                              {application.current_stage === "withdrawn" && "Application was withdrawn"}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-green-600">
                            <IndianRupee className="w-4 h-4" />
                            <span>{(job.package_max / 100000).toFixed(1)}L</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {job.application_deadline 
                                ? new Date(job.application_deadline).toLocaleDateString()
                                : "No deadline"
                              }
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Eligible Branches:</p>
                          <div className="flex flex-wrap gap-1">
                            {job.branches_allowed?.slice(0, 3).map((branch) => (
                              <Badge key={branch} variant="outline" className="text-xs">
                                {branch}
                              </Badge>
                            ))}
                            {job.branches_allowed && job.branches_allowed.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.branches_allowed.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          {activeTab === "applied" && application ? (
                            <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => router.push(`/jobs/${job.id}/apply`)}
                              className="w-full transition-all duration-200 hover:scale-105"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Track Application
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="w-full transition-all duration-200 hover:scale-105"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === "eligible" 
                    ? "No jobs match your eligibility criteria."
                    : activeTab === "applied"
                    ? "You haven't applied to any jobs yet."
                    : activeTab === "deadline"
                    ? "No jobs are ending soon."
                    : "No active jobs available at the moment."
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}