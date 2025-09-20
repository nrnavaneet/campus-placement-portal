"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabaseClient, type Job, type StudentDetails } from "@/lib/supabase"
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
} from "lucide-react"

// Mock jobs data for demo
const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "Software Developer",
    company_name: "TechCorp Solutions",
    company_logo: "/placeholder.svg?height=60&width=60",
    description:
      "Join our dynamic team as a Software Developer. Work on cutting-edge projects using modern technologies like React, Node.js, and cloud platforms. You'll be responsible for developing scalable web applications and collaborating with cross-functional teams.",
    package_min: 600000,
    package_max: 1200000,
    eligibility_criteria: { experience: "0-2 years", skills: ["JavaScript", "React", "Node.js"] },
    branches_allowed: ["Computer Science", "Information Technology", "Electronics and Communication"],
    min_ug_percentage: 70.0,
    no_backlogs_required: true,
    counts_as_offer: true,
    timeline: [
      { stage: "Application", date: "2024-02-01", description: "Submit application with resume" },
      { stage: "Online Test", date: "2024-02-15", description: "Technical assessment" },
      { stage: "Interview", date: "2024-02-25", description: "Technical and HR rounds" },
      { stage: "Result", date: "2024-03-05", description: "Final selection results" },
    ],
    status: "active",
    application_deadline: "2024-12-31T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "job-2",
    title: "Data Analyst Intern",
    company_name: "DataViz Inc",
    company_logo: "/placeholder.svg?height=60&width=60",
    description:
      "Exciting internship opportunity to work with big data and analytics. Perfect for students looking to gain industry experience. You'll work on real-world data projects and learn from experienced data scientists.",
    package_min: 25000,
    package_max: 40000,
    eligibility_criteria: { experience: "Fresher", skills: ["Python", "SQL", "Excel"] },
    branches_allowed: ["Computer Science", "Information Technology", "Mathematics", "Statistics"],
    min_ug_percentage: 65.0,
    no_backlogs_required: true,
    counts_as_offer: false,
    timeline: [
      { stage: "Application", date: "2024-01-20", description: "Submit application" },
      { stage: "Assessment", date: "2024-02-05", description: "Data analysis task" },
      { stage: "Interview", date: "2024-02-12", description: "Technical discussion" },
      { stage: "Selection", date: "2024-02-20", description: "Internship confirmation" },
    ],
    status: "upcoming",
    application_deadline: "2024-12-25T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "job-3",
    title: "Frontend Developer",
    company_name: "InnovateTech",
    company_logo: "/placeholder.svg?height=60&width=60",
    description:
      "Looking for a creative Frontend Developer to join our UI/UX team. Work on modern web applications using React, TypeScript, and cutting-edge design systems.",
    package_min: 500000,
    package_max: 900000,
    eligibility_criteria: { experience: "0-1 years", skills: ["React", "TypeScript", "CSS"] },
    branches_allowed: ["Computer Science", "Information Technology"],
    min_ug_percentage: 75.0,
    no_backlogs_required: true,
    counts_as_offer: true,
    timeline: [
      { stage: "Application", date: "2024-01-25", description: "Submit portfolio and resume" },
      { stage: "Portfolio Review", date: "2024-02-08", description: "Technical portfolio assessment" },
      { stage: "Technical Interview", date: "2024-02-18", description: "Coding and design discussion" },
      { stage: "Final Round", date: "2024-02-28", description: "Cultural fit and offer discussion" },
    ],
    status: "ongoing",
    application_deadline: "2024-12-20T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch student profile
      const storedProfile = localStorage.getItem("student_profile")
      if (storedProfile) {
        const studentData = JSON.parse(storedProfile)
        setStudent(studentData)
        calculateProfileCompletion(studentData)
      }

      // Fetch jobs from database only (no fake/mock jobs)
      let allJobs: Job[] = []

      try {
        // Use the wrapped client to handle the async operation properly
        const result = await new Promise((resolve) => {
          const query = supabaseClient.from("jobs").select("*")
          if ('then' in query) {
            query.then(resolve)
          } else {
            resolve(query)
          }
        }) as any
        
        if (result && result.data) {
          allJobs = result.data
        }
      } catch (error) {
        console.log("Error fetching jobs from database:", error)
      }

      // Sort by created date (newest first)
      const sortedJobs = allJobs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setJobs(sortedJobs)
    } catch (error) {
      console.error("Error fetching data:", error)
      // Fallback to mock data
      setJobs(mockJobs)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateProfileCompletion = (studentData: StudentDetails) => {
    let completed = 0
    const totalFields = 12

    if (studentData.first_name) completed++
    if (studentData.gender) completed++
    if (studentData.college_reg_no) completed++
    if (studentData.date_of_birth) completed++
    if (studentData.college_email) completed++
    if (studentData.personal_email) completed++
    if (studentData.mobile_number) completed++
    if (studentData.branch) completed++
    if (studentData.ug_percentage) completed++
    if (studentData.resume_url) completed++
    if (studentData.ug_percentage >= 60) completed++
    if (!studentData.active_backlogs) completed++

    const percentage = Math.round((completed / totalFields) * 100)
    setProfileCompletion(percentage)
  }

  const checkEligibility = (job: Job) => {
    if (!student) return { eligible: false, reasons: ["Profile not found"] }

    const reasons: string[] = []
    let eligible = true

    // Check branch
    if (!job.branches_allowed.includes(student.branch)) {
      eligible = false
      reasons.push(`Branch not eligible (Required: ${job.branches_allowed.join(", ")})`)
    }

    // Check percentage
    if (student.ug_percentage < job.min_ug_percentage) {
      eligible = false
      reasons.push(`UG percentage too low (Required: ${job.min_ug_percentage}%, You have: ${student.ug_percentage}%)`)
    }

    // Check backlogs
    if (job.no_backlogs_required && student.active_backlogs) {
      eligible = false
      reasons.push("Active backlogs not allowed")
    }

    // Check if resume is required for application (not for eligibility check)
    const resumeRequired = !student.resume_url

    return { eligible, reasons, resumeRequired }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "ongoing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
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

  const handleApply = (jobId: string) => {
    if (!student) {
      router.push("/register")
      return
    }

    const job = jobs.find((j) => j.id === jobId)
    if (!job) return

    const eligibilityCheck = checkEligibility(job)

    if (!eligibilityCheck.eligible) {
      // Show eligibility error
      return
    }

    if (eligibilityCheck.resumeRequired) {
      // Redirect to profile to complete
      router.push("/profile?message=complete-profile-to-apply")
      return
    }

    router.push(`/jobs/${jobId}/apply`)
  }

  const filterJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status)
  }

  const JobCard = ({ job }: { job: Job }) => {
    const eligibilityCheck = student
      ? checkEligibility(job)
      : { eligible: false, reasons: ["Please register first"], resumeRequired: true }
    const timeRemaining = getTimeRemaining(job.application_deadline)
    const isExpired = timeRemaining === "Expired"

    return (
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl leading-tight">{job.title}</CardTitle>
                <CardDescription className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 truncate">
                  {job.company_name}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
              <Badge className={getStatusColor(job.status)}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              {student &&
                (eligibilityCheck.eligible ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Eligible
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Eligible
                  </Badge>
                ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base line-clamp-3">{job.description}</p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="truncate">{formatSalary(job.package_min, job.package_max)}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{job.min_ug_percentage}% min</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>{job.branches_allowed.length} branches</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className={`truncate ${isExpired ? "text-red-600 font-medium" : ""}`}>{timeRemaining}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Eligible Branches:</p>
            <div className="flex flex-wrap gap-1">
              {job.branches_allowed.map((branch) => (
                <Badge key={branch} variant="outline" className="text-xs">
                  {branch}
                </Badge>
              ))}
            </div>
          </div>

          {student && !eligibilityCheck.eligible && (
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
          )}

          {student && eligibilityCheck.eligible && eligibilityCheck.resumeRequired && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Complete your profile (upload resume) before applying for jobs.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => router.push(`/jobs/${job.id}`)} className="w-full sm:w-auto">
              View Details
            </Button>
            <Button
              onClick={() => handleApply(job.id)}
              disabled={isExpired || (student && eligibilityCheck?.eligible !== true) || false}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {isExpired
                ? "Expired"
                : !student
                  ? "Register to Apply"
                  : !eligibilityCheck.eligible
                    ? "Not Eligible"
                    : eligibilityCheck.resumeRequired
                      ? "Complete Profile"
                      : "Apply Now"}
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
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Job & Internship Opportunities
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            Discover and apply for placement opportunities
          </p>
        </div>

        {/* Profile Completion Warning */}
        {student && profileCompletion < 100 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Complete your profile to apply for jobs</p>
                  <p className="text-sm">Profile completion: {profileCompletion}%</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  className="w-full sm:w-auto"
                >
                  Complete Profile
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!student && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Register to apply for jobs</p>
                  <p className="text-sm">Create your profile to access placement opportunities</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/register")}
                  className="w-full sm:w-auto"
                >
                  Register Now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Active</span>
              <span className="sm:hidden">Active</span>
              <span>({filterJobsByStatus("active").length})</span>
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Ongoing</span>
              <span className="sm:hidden">Live</span>
              <span>({filterJobsByStatus("ongoing").length})</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Upcoming</span>
              <span className="sm:hidden">Soon</span>
              <span>({filterJobsByStatus("upcoming").length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filterJobsByStatus("active").map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {filterJobsByStatus("active").length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active jobs available at the moment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filterJobsByStatus("ongoing").map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {filterJobsByStatus("ongoing").length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No ongoing recruitment processes</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {filterJobsByStatus("upcoming").map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            {filterJobsByStatus("upcoming").length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming opportunities</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Refresh button for mobile */}
        <div className="flex justify-center mt-8 sm:hidden">
          <Button onClick={fetchData} variant="outline" className="bg-white/80 backdrop-blur-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Jobs
          </Button>
        </div>
      </div>
    </div>
  )
}
