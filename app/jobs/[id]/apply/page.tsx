"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import type { Job, StudentDetails } from "@/lib/supabase"
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building,
  DollarSign,
  Calendar,
  GraduationCap,
  FileText,
  Users,
  Clock,
} from "lucide-react"

export default function JobApplicationPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState({ eligible: false, reasons: [] as string[] })
  const [confirmations, setConfirmations] = useState({
    eligibility: false,
    documents: false,
    terms: false,
  })
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      // Fetch job details from API
      const jobResponse = await fetch(`/api/admin/jobs/${jobId}`)
      if (!jobResponse.ok) {
        console.error('Failed to fetch job')
        router.push("/jobs")
        return
      }
      
      const jobResult = await jobResponse.json()
      const jobData = jobResult.data
      
      if (!jobData) {
        router.push("/jobs")
        return
      }
      setJob(jobData)

      // Fetch student profile from API
      try {
        const studentEmail = "22etcs002132@msruas.ac.in" // Default for demo
        const studentResponse = await fetch(`/api/student/profile?email=${encodeURIComponent(studentEmail)}`)
        
        if (studentResponse.ok) {
          const studentResult = await studentResponse.json()
          const studentData = studentResult.data
          setStudent(studentData)
          checkEligibility(jobData, studentData)
          
          // Check if already applied using API
          checkExistingApplication(studentData.college_reg_no)
        } else {
          // Fallback to localStorage if API fails
          const storedProfile = localStorage.getItem("student_profile")
          if (storedProfile) {
            const studentData = JSON.parse(storedProfile)
            setStudent(studentData)
            checkEligibility(jobData, studentData)
            checkExistingApplication(studentData.college_reg_no)
          } else {
            router.push("/profile")
            return
          }
        }
      } catch (studentError) {
        console.error("Error fetching student profile:", studentError)
        // Fallback to localStorage
        const storedProfile = localStorage.getItem("student_profile")
        if (storedProfile) {
          const studentData = JSON.parse(storedProfile)
          setStudent(studentData)
          checkEligibility(jobData, studentData)
          checkExistingApplication(studentData.college_reg_no)
        } else {
          router.push("/profile")
          return
        }
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      router.push("/jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingApplication = async (studentRegNo: string) => {
    try {
      const response = await fetch(`/api/student/applications?student_id=${studentRegNo}`)
      if (response.ok) {
        const data = await response.json()
        const existingApp = data.data?.find((app: any) => app.job_id === jobId)
        setHasApplied(!!existingApp)
      }
    } catch (error) {
      console.error('Error checking existing application:', error)
      setHasApplied(false) // Default to false if API fails
    }
  }

  const checkEligibility = (jobData: Job, studentData: StudentDetails) => {
    const reasons: string[] = []
    let eligible = true

    // Check branch
    if (!jobData.branches_allowed.includes(studentData.branch)) {
      eligible = false
      reasons.push(`Your branch (${studentData.branch}) is not eligible for this position`)
    }

    // Check percentage
    if (studentData.ug_percentage < jobData.min_ug_percentage) {
      eligible = false
      reasons.push(
        `UG percentage requirement not met (Required: ${jobData.min_ug_percentage}%, You have: ${studentData.ug_percentage}%)`,
      )
    }

    // Check backlogs
    if (jobData.no_backlogs_required && studentData.active_backlogs) {
      eligible = false
      reasons.push("Active backlogs not allowed for this position")
    }

    // Check resume
    if (!studentData.resume_url) {
      eligible = false
      reasons.push("Resume not uploaded")
    }

    setEligibilityCheck({ eligible, reasons })
  }

    const handleApply = async () => {
    if (!student || !job) return

    setIsApplying(true)
    try {
      // Submit application using API
      const response = await fetch('/api/student/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.college_reg_no, // Use college_reg_no consistently
          job_id: job.id
        }),
      })

      if (response.ok) {
        // Application successful
        setHasApplied(true)
        
        // Show success message and redirect
        setTimeout(() => {
          router.push('/applications')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Application failed:', errorData)
        if (errorData.error?.includes('already submitted')) {
          alert('You have already applied for this position.')
        } else {
          alert('Failed to submit application. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  const formatSalary = (min: number, max: number) => {
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`
      }
      return `₹${(amount / 1000).toFixed(0)}K`
    }
    return `${formatAmount(min)} - ${formatAmount(max)}`
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} days left`
    if (hours > 0) return `${hours} hours left`
    return "Less than 1 hour left"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading job details...</div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Job not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Apply for {job.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Review the job details and submit your application</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <CardDescription className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {job.company_name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Job Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{job.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-medium">{formatSalary(job.package_min, job.package_max)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Min Percentage</p>
                      <p className="font-medium">{job.min_ug_percentage}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Eligible Branches</p>
                      <p className="font-medium">{job.branches_allowed.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="font-medium">{getTimeRemaining(job.application_deadline)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Eligible Branches</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.branches_allowed.map((branch) => (
                      <Badge key={branch} variant="outline">
                        {branch}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Selection Timeline</h3>
                  <div className="space-y-3">
                    {job.timeline.map((stage, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{stage.stage}</p>
                          <p className="text-sm text-gray-500">{stage.description}</p>
                          {stage.date && (
                            <p className="text-xs text-gray-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(stage.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Panel */}
          <div className="space-y-6">
            {/* Eligibility Check */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {eligibilityCheck.eligible ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Eligibility Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eligibilityCheck.eligible ? (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      You are eligible to apply for this position!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <div className="space-y-1">
                        <p className="font-medium">You are not eligible due to:</p>
                        <ul className="list-disc list-inside text-sm">
                          {eligibilityCheck.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Application Form */}
            {eligibilityCheck.eligible && !hasApplied && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Submit Application</CardTitle>
                  <CardDescription>Confirm the requirements before applying</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="eligibility"
                        checked={confirmations.eligibility}
                        onCheckedChange={(checked) =>
                          setConfirmations({ ...confirmations, eligibility: checked as boolean })
                        }
                      />
                      <label htmlFor="eligibility" className="text-sm">
                        I confirm that I meet all eligibility criteria
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="documents"
                        checked={confirmations.documents}
                        onCheckedChange={(checked) =>
                          setConfirmations({ ...confirmations, documents: checked as boolean })
                        }
                      />
                      <label htmlFor="documents" className="text-sm">
                        I have uploaded all required documents including resume
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={confirmations.terms}
                        onCheckedChange={(checked) => setConfirmations({ ...confirmations, terms: checked as boolean })}
                      />
                      <label htmlFor="terms" className="text-sm">
                        I agree to the terms and conditions of the application process
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleApply}
                    disabled={
                      isApplying || !confirmations.eligibility || !confirmations.documents || !confirmations.terms
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isApplying ? "Submitting Application..." : "Submit Application"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Already Applied */}
            {hasApplied && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <div className="space-y-2">
                        <p className="font-medium">Application Submitted!</p>
                        <p className="text-sm">
                          You have already applied for this position. You can track your application status in the
                          Applications section.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => router.push("/applications")} className="w-full mt-4" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Application Status
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Student Profile Summary */}
            {student && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="text-sm font-medium">{student.first_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Registration:</span>
                    <span className="text-sm font-medium">{student.college_reg_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Branch:</span>
                    <span className="text-sm font-medium">{student.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Percentage:</span>
                    <span className="text-sm font-medium">{student.ug_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Resume:</span>
                    <span className="text-sm font-medium">
                      {student.resume_url ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Missing
                        </Badge>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
