"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import type { Job, StudentDetails } from "@/lib/supabase"
import { toast } from "sonner"
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building,
  IndianRupee,
  Calendar,
  GraduationCap,
  FileText,
  Users,
  Clock,
} from "lucide-react"

export default function JobApplicationPage() {
  const [job, setJob] = useState<Job | null>(null)
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
  const { student, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [jobId, authLoading])

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

      // Check if student is authenticated
      if (!student) {
        toast.error('Please login to apply for jobs')
        router.push('/')
        return
      }

      // Check eligibility and existing application
      checkEligibility(jobData, student)
      checkExistingApplication(student.college_reg_no)

    } catch (error) {
      console.error("Error fetching data:", error)
      router.push("/jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingApplication = async (studentRegNo: string) => {
    try {
      const response = await fetch(`/api/student/applications?student_id=${encodeURIComponent(studentRegNo)}`)
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
        toast.success('Application submitted successfully!', {
          description: 'Your application has been received. Check the applications page for updates.',
        })
        
        // Show success message and redirect
        setTimeout(() => {
          router.push('/applications')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Application failed:', errorData)
        if (errorData.error?.includes('already submitted')) {
          toast.error('Already Applied', {
            description: 'You have already applied for this position.',
          })
        } else {
          toast.error('Application Failed', {
            description: errorData.error || 'Failed to submit application. Please try again.',
          })
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Application Failed', {
        description: 'Network error. Please check your connection and try again.',
      })
    } finally {
      setIsApplying(false)
    }
  }

  const canApply = () => {
    return (
      eligibilityCheck.eligible &&
      !hasApplied &&
      confirmations.eligibility &&
      confirmations.documents &&
      confirmations.terms
    )
  }

  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job Not Found</h1>
            <Button onClick={() => router.push("/jobs")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {job.company_name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
                      <CardDescription className="text-lg flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        {job.company_name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={job.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-semibold">Package</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {job.package_min && job.package_max
                          ? `${formatCurrency(job.package_min)} - ${formatCurrency(job.package_max)}`
                          : "Not disclosed"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold">Application Deadline</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(job.application_deadline)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-semibold">Min Percentage</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {job.min_ug_percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-semibold">Eligible Branches</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {job.branches_allowed.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Job Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {job.no_backlogs_required && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This position requires no active backlogs.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            {job.timeline && job.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Selection Process
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.timeline.map((step: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{step.stage}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                          </div>
                          {step.date && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {formatDate(step.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Eligibility Check */}
                <div>
                  <h4 className="font-semibold mb-2">Eligibility Check</h4>
                  {eligibilityCheck.eligible ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">You are eligible for this position</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Eligibility requirements not met</span>
                      </div>
                      <ul className="text-sm text-red-600 ml-6 space-y-1">
                        {eligibilityCheck.reasons.map((reason, index) => (
                          <li key={index} className="list-disc">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Application Status */}
                {hasApplied ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      You have already applied for this position. Check your applications page for updates.
                    </AlertDescription>
                  </Alert>
                ) : eligibilityCheck.eligible ? (
                  <div className="space-y-4">
                    {/* Confirmations */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="eligibility"
                          checked={confirmations.eligibility}
                          onCheckedChange={() => handleConfirmationChange('eligibility')}
                        />
                        <label htmlFor="eligibility" className="text-sm leading-relaxed">
                          I confirm that I meet all eligibility criteria for this position
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="documents"
                          checked={confirmations.documents}
                          onCheckedChange={() => handleConfirmationChange('documents')}
                        />
                        <label htmlFor="documents" className="text-sm leading-relaxed">
                          I have uploaded my updated resume and all required documents
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={confirmations.terms}
                          onCheckedChange={() => handleConfirmationChange('terms')}
                        />
                        <label htmlFor="terms" className="text-sm leading-relaxed">
                          I agree to the terms and conditions of the placement process
                        </label>
                      </div>
                    </div>

                    <Button 
                      onClick={handleApply}
                      disabled={!canApply() || isApplying}
                      className="w-full"
                    >
                      {isApplying ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      You are not eligible to apply for this position. Please check the requirements above.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Student Info */}
                {student && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Your Profile</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Name:</strong> {student.first_name}</div>
                      <div><strong>Reg No:</strong> {student.college_reg_no}</div>
                      <div><strong>Branch:</strong> {student.branch}</div>
                      <div><strong>Percentage:</strong> {student.ug_percentage}%</div>
                      <div><strong>Active Backlogs:</strong> {student.active_backlogs ? "Yes" : "No"}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}