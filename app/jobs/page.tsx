"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabaseClient, type Job, type StudentDetails, downloadResume } from "@/lib/supabase"
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  GraduationCap,
  RefreshCw,
  Eye,
  FileText,
  Send,
  Download,
} from "lucide-react"

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentDetails | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isApplicationPreviewOpen, setIsApplicationPreviewOpen] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchJobs()
    fetchStudentProfile()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, activeTab, studentProfile])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/jobs')
      if (response.ok) {
        const result = await response.json()
        setJobs(result.data || [])
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
      const studentEmail = "22etcs002132@msruas.ac.in"
      
      const response = await fetch(`/api/student/profile?email=${encodeURIComponent(studentEmail)}`)
      if (response.ok) {
        const result = await response.json()
        setStudentProfile(result.data)
      }
    } catch (error) {
      console.error('Error fetching student profile:', error)
    }
  }

  const filterJobs = () => {
    if (!studentProfile) {
      setFilteredJobs(jobs.filter(job => job.status === "active"))
      return
    }

    let filtered = jobs

    switch (activeTab) {
      case "eligible":
        filtered = jobs.filter(job => 
          job.status === "active" &&
          isEligibleForJob(job, studentProfile)
        )
        break
      case "applied":
        filtered = []
        break
      case "deadline":
        filtered = jobs.filter(job => {
          if (!job.application_deadline) return false
          const deadline = new Date(job.application_deadline)
          const today = new Date()
          const diffTime = deadline.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays <= 7 && diffDays > 0 && job.status === "active"
        })
        break
      default:
        filtered = jobs.filter(job => job.status === "active")
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

  const handleApplyClick = (job: Job) => {
    if (!studentProfile) {
      setError('Please complete your profile before applying')
      return
    }

    if (!isEligibleForJob(job, studentProfile)) {
      setError('You are not eligible for this job')
      return
    }

    setSelectedJob(job)
    setIsApplicationPreviewOpen(true)
  }

  const handleSubmitApplication = async () => {
    if (!selectedJob || !studentProfile) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/student/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentProfile.id,
          job_id: selectedJob.id,
        }),
      })

      if (response.ok) {
        setApplicationStatus('Application submitted successfully!')
        setIsApplicationPreviewOpen(false)
        fetchJobs() // Refresh to update application status
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      setError('Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

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
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-300 rounded"></div>
                        <div className="h-3 bg-gray-300 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
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
                        <Badge
                          className={
                            job.status === "active"
                              ? "bg-green-100 text-green-800"
                              : job.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-sm text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{(job.package_min / 100000).toFixed(1)}L - ₹{(job.package_max / 100000).toFixed(1)}L</span>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {job.status === "active" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleApplyClick(job)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={!studentProfile || !isEligibleForJob(job, studentProfile)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

        {/* Application Preview Dialog */}
        <Dialog open={isApplicationPreviewOpen} onOpenChange={setIsApplicationPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Preview</DialogTitle>
              <DialogDescription>
                Review your application details before submitting
              </DialogDescription>
            </DialogHeader>

            {selectedJob && studentProfile && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">{selectedJob.title}</h3>
                  <p className="text-blue-700">{selectedJob.company_name}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    Package: ₹{(selectedJob.package_min / 100000).toFixed(1)}L - ₹{(selectedJob.package_max / 100000).toFixed(1)}L
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Student Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{studentProfile.first_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Registration:</span>
                        <span className="ml-2 font-medium">{studentProfile.college_reg_no}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Branch:</span>
                        <span className="ml-2 font-medium">{studentProfile.branch}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">UG Percentage:</span>
                        <span className="ml-2 font-medium">{studentProfile.ug_percentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Resume</h4>
                    {studentProfile.resume_url ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resume Available
                        </Badge>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(studentProfile.resume_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadResume(studentProfile.resume_url!, `${studentProfile.college_reg_no}_Resume.pdf`)
                              } catch (error) {
                                console.error('Download failed:', error)
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Resume Required
                      </Badge>
                    )}
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      By submitting this application, you confirm that all the information provided is accurate.
                      You will receive notifications about the application status via email.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsApplicationPreviewOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting || !studentProfile.resume_url}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}