"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { JobApplicationDialog } from "@/components/job-application-dialog"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Job, StudentDetails, PlacementPolicy } from "@/lib/supabase"
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
  MapPin,
  Briefcase,
} from "lucide-react"

export default function JobDetailsPage() {
  const { student: authenticatedStudent } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [placementPolicy, setPlacementPolicy] = useState<PlacementPolicy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasApplied, setHasApplied] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState({ eligible: false, reasons: [] as string[] })
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      // Fetch job details and placement policy in parallel
      const [jobResponse, policyResponse] = await Promise.allSettled([
        fetch(`/api/admin/jobs/${jobId}`),
        fetch('/api/admin/placement-policy')
      ])
      
      if (jobResponse.status !== 'fulfilled' || !jobResponse.value.ok) {
        console.error('Failed to fetch job')
        router.push("/jobs")
        return
      }
      
      const jobResult = await jobResponse.value.json()
      const jobData = jobResult.data
      
      if (!jobData) {
        router.push("/jobs")
        return
      }
      setJob(jobData)

      // Process placement policy
      let policyData = null
      if (policyResponse.status === 'fulfilled' && policyResponse.value.ok) {
        const policyResult = await policyResponse.value.json()
        policyData = policyResult.data && policyResult.data.length > 0 ? policyResult.data[0] : null
        setPlacementPolicy(policyData)
      }

      // Use authenticated student profile
      if (authenticatedStudent) {
        setStudent(authenticatedStudent)
        checkEligibility(jobData, authenticatedStudent, policyData)
        
        // Check if already applied using API
        checkExistingApplication(authenticatedStudent.college_reg_no)
      } else {
        toast.error("Please log in to view job details")
        router.push("/")
        return
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
      // Fallback to localStorage if API fails
      const applications = JSON.parse(localStorage.getItem("student_applications") || "[]")
      const existingApplication = applications.find((app: any) => app.job_id === jobId)
      setHasApplied(!!existingApplication)
    }
  }

  const checkEligibility = (jobData: Job, studentData: StudentDetails, policyData: PlacementPolicy | null = null) => {
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

    // Check additional eligibility criteria
    if (jobData.min_tenth_percentage && studentData.tenth_percentage !== null && studentData.tenth_percentage !== undefined && studentData.tenth_percentage < jobData.min_tenth_percentage) {
      eligible = false
      reasons.push(
        `10th percentage requirement not met (Required: ${jobData.min_tenth_percentage}%, You have: ${studentData.tenth_percentage}%)`,
      )
    }

    if (jobData.min_twelfth_percentage && studentData.twelfth_percentage !== null && studentData.twelfth_percentage !== undefined && studentData.twelfth_percentage < jobData.min_twelfth_percentage) {
      eligible = false
      reasons.push(
        `12th percentage requirement not met (Required: ${jobData.min_twelfth_percentage}%, You have: ${studentData.twelfth_percentage}%)`,
      )
    }

    if (jobData.eligible_courses && jobData.eligible_courses.length > 0 && studentData.course && !jobData.eligible_courses.includes(studentData.course)) {
      eligible = false
      reasons.push(`Your course (${studentData.course}) is not eligible`)
    }

    if (jobData.eligibility_criteria?.year_of_graduation && studentData.year_of_graduation !== jobData.eligibility_criteria.year_of_graduation) {
      eligible = false
      reasons.push(`Graduation year requirement not met (Required: ${jobData.eligibility_criteria.year_of_graduation}, You have: ${studentData.year_of_graduation})`)
    }

    if (jobData.no_backlogs_required && studentData.active_backlogs) {
      eligible = false
      reasons.push("Active backlogs not allowed")
    }

    if (jobData.no_offer && policyData && studentData.placement_status?.offers && studentData.placement_status.offers.length >= policyData.max_offers_allowed) {
      eligible = false
      reasons.push(`Maximum offers limit reached (${studentData.placement_status.offers.length}/${policyData.max_offers_allowed})`)
    }

    // Check placement policy rules (skip for no_offer jobs)
    if (!jobData.no_offer && policyData && studentData.placement_status?.offers) {
      const currentOffers = studentData.placement_status.offers
      
      // Check max offers limit
      if (currentOffers.length >= policyData.max_offers_allowed) {
        eligible = false
        reasons.push(`Maximum offers limit reached (${currentOffers.length}/${policyData.max_offers_allowed})`)
      }
      
      // Check second offer multiplier rule for jobs that count as offers
      if (jobData.counts_as_offer && currentOffers.length > 0 && policyData.second_offer_multiplier > 1) {
        const maxCurrentPackage = Math.max(...currentOffers.map((offer: any) => offer.package || 0))
        const requiredMinPackage = maxCurrentPackage * policyData.second_offer_multiplier
        
        if (jobData.package_min < requiredMinPackage) {
          eligible = false
          reasons.push(`Package too low: Need ₹${(requiredMinPackage / 100000).toFixed(1)}L minimum for next offer`)
        }
      }
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
    
    if (min === max) {
      return formatAmount(min)
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
          <div className="mb-6">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      <div>
                        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div>
                          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Job Header - Simplified */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl mb-1">{job.title}</CardTitle>
                      <CardDescription className="text-lg font-medium text-blue-600 dark:text-blue-400">
                        {job.company_name}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.counts_as_offer ? "Full-time Position" : "Internship"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        className={
                          job.status === "active"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : job.status === "upcoming"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                      {student && (
                        <Badge 
                          className={
                            eligibilityCheck.eligible 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {eligibilityCheck.eligible ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Eligible
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Not Eligible
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Key Stats in a cleaner grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mb-2 mx-auto">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Package</p>
                    <p className="font-semibold text-sm">{formatSalary(job.package_min, job.package_max)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2 mx-auto">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Min UG %</p>
                    <p className="font-semibold text-sm">{job.min_ug_percentage}%</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-2 mx-auto">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Branches</p>
                    <p className="font-semibold text-sm">{job.branches_allowed.length}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-2 mx-auto">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Deadline</p>
                    <p className={`font-semibold text-sm ${isExpired ? "text-red-600" : ""}`}>
                      {getTimeRemaining(job.application_deadline)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Status/Action - Moved up and simplified */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                {hasApplied ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Application Submitted</p>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          You have successfully applied for this position.
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push('/applications')}
                      variant="outline" 
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      View Status
                    </Button>
                  </div>
                ) : !student ? (
                  <div className="text-center p-4">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-3">Complete your profile to apply</p>
                    <Button onClick={() => router.push('/profile')}>
                      Complete Profile
                    </Button>
                  </div>
                ) : !eligibilityCheck.eligible ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200 mb-2">Not Eligible to Apply</p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          You don't meet the eligibility requirements for this position.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="text-center p-4">
                    <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Application Deadline Passed</p>
                    <p className="text-sm text-gray-500">This position is no longer accepting applications.</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Ready to Apply!</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      You meet all the eligibility criteria for this position.
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => setIsApplicationDialogOpen(true)}
                      className="px-8"
                    >
                      Apply Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{job.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Eligibility and Requirements */}
          <div className="lg:col-span-1 space-y-6">
            {/* Eligibility Issues - Show when not eligible */}
            {student && !eligibilityCheck.eligible && eligibilityCheck.reasons.length > 0 && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Eligibility Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {eligibilityCheck.reasons.map((reason, index) => (
                      <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Additional Eligibility Criteria */}
            {(job.min_tenth_percentage || job.min_twelfth_percentage || job.eligible_courses && job.eligible_courses.length > 0 || job.eligibility_criteria?.year_of_graduation || job.no_backlogs_required) && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Additional Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.min_tenth_percentage && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Min 10th %</p>
                        <p className="font-medium">{job.min_tenth_percentage}%</p>
                      </div>
                    </div>
                  )}
                  {job.min_twelfth_percentage && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Min 12th %</p>
                        <p className="font-medium">{job.min_twelfth_percentage}%</p>
                      </div>
                    </div>
                  )}
                  {job.eligibility_criteria?.year_of_graduation && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Grad Year</p>
                        <p className="font-medium">{job.eligibility_criteria.year_of_graduation}</p>
                      </div>
                    </div>
                  )}
                  {job.no_backlogs_required && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Backlogs</p>
                        <p className="font-medium text-red-600">Not Allowed</p>
                      </div>
                    </div>
                  )}
                  {job.eligible_courses && job.eligible_courses.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eligible Courses:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.eligible_courses.map((course: string) => (
                          <Badge key={course} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Eligible Branches */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Eligible Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.branches_allowed.map((branch) => (
                    <Badge key={branch} variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                      {branch}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selection Process */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selection Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.timeline.map((stage, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
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

            {/* Company Info */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Company Information</CardTitle>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
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

      {/* Application Dialog */}
      <JobApplicationDialog
        isOpen={isApplicationDialogOpen}
        onClose={() => setIsApplicationDialogOpen(false)}
        job={job}
        onApplicationSuccess={() => {
          setHasApplied(true)
          // Optionally refresh application status
          if (student) {
            checkExistingApplication(student.college_reg_no)
          }
        }}
      />
    </div>
  )
}
