"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  MapPin,
  Briefcase,
} from "lucide-react"

export default function JobDetailsPage() {
  const [job, setJob] = useState<Job | null>(null)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState({ eligible: false, reasons: [] as string[] })
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      // Fetch job details
      const allJobs = JSON.parse(localStorage.getItem("all_jobs") || "[]")
      const jobData = allJobs.find((j: Job) => j.id === jobId)

      if (!jobData) {
        router.push("/jobs")
        return
      }
      setJob(jobData)

      // Fetch student profile
      const storedProfile = localStorage.getItem("student_profile")
      if (storedProfile) {
        const studentData = JSON.parse(storedProfile)
        setStudent(studentData)
        checkEligibility(jobData, studentData)
      }

      // Check if already applied
      const applications = JSON.parse(localStorage.getItem("student_applications") || "[]")
      const existingApplication = applications.find((app: any) => app.job_id === jobId)
      setHasApplied(!!existingApplication)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkEligibility = (jobData: Job, studentData: StudentDetails) => {
    const reasons: string[] = []
    let eligible = true

    if (!jobData.branches_allowed.includes(studentData.branch)) {
      eligible = false
      reasons.push(`Your branch (${studentData.branch}) is not eligible`)
    }

    if (studentData.ug_percentage < jobData.min_ug_percentage) {
      eligible = false
      reasons.push(
        `UG percentage requirement not met (Required: ${jobData.min_ug_percentage}%, You have: ${studentData.ug_percentage}%)`,
      )
    }

    if (jobData.no_backlogs_required && studentData.active_backlogs) {
      eligible = false
      reasons.push("Active backlogs not allowed")
    }

    if (!studentData.resume_url) {
      eligible = false
      reasons.push("Resume not uploaded")
    }

    setEligibilityCheck({ eligible, reasons })
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

  const isExpired = getTimeRemaining(job.application_deadline) === "Expired"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
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
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Bangalore, India</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.counts_as_offer ? "Full-time" : "Internship"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        job.status === "active"
                          ? "bg-green-100 text-green-800"
                          : job.status === "upcoming"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "ongoing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    {student &&
                      (eligibilityCheck.eligible ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Eligible
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Not Eligible
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                      <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                        {getTimeRemaining(job.application_deadline)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Requirements & Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Academic Requirements</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Minimum UG percentage: {job.min_ug_percentage}%</li>
                    <li>• {job.no_backlogs_required ? "No active backlogs allowed" : "Active backlogs permitted"}</li>
                    <li>• Resume upload mandatory</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Eligible Branches</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.branches_allowed.map((branch) => (
                      <Badge key={branch} variant="outline">
                        {branch}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection Process */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Selection Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.timeline.map((stage, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{stage.stage}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stage.description}</p>
                        {stage.date && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(stage.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Status */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      You have already applied for this position.
                    </AlertDescription>
                  </Alert>
                ) : isExpired ? (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      Application deadline has passed.
                    </AlertDescription>
                  </Alert>
                ) : student && eligibilityCheck.eligible ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        You are eligible to apply for this position!
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => router.push(`/jobs/${job.id}/apply`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Apply Now
                    </Button>
                  </div>
                ) : student ? (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <div className="space-y-1">
                        <p className="font-medium">Not eligible due to:</p>
                        <ul className="list-disc list-inside text-sm">
                          {eligibilityCheck.reasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        Please complete your profile to check eligibility.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => router.push("/profile")} variant="outline" className="w-full">
                      Complete Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Company:</span>
                  <span className="text-sm font-medium">{job.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Industry:</span>
                  <span className="text-sm font-medium">Technology</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Location:</span>
                  <span className="text-sm font-medium">Bangalore, India</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="text-sm font-medium">
                    {job.counts_as_offer ? "Full-time Position" : "Internship"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Posted:</span>
                  <span className="text-sm font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push("/jobs")}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse More Jobs
                </Button>

                {hasApplied && (
                  <Button
                    onClick={() => router.push("/applications")}
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Application Status
                  </Button>
                )}

                <Button
                  onClick={() => router.push("/profile")}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
