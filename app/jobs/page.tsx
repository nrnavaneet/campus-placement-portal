"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JobApplicationDialog } from "@/components/job-application-dialog"
import { supabaseClient, type Job, type StudentDetails, type PlacementPolicy, downloadResume } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
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
  Search,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// Countdown component
const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const deadlineTime = new Date(deadline).getTime()
      const difference = deadlineTime - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline])

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
        <Clock className="w-3 h-3" />
        <span className="font-semibold">Expired</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
      <Clock className="w-3 h-3" />
      <span className="font-mono font-semibold">
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {timeLeft.hours.toString().padStart(2, '0')}:
        {timeLeft.minutes.toString().padStart(2, '0')}:
        {timeLeft.seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}

export default function JobsPage() {
  const { student } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentDetails | null>(null)
  const [placementPolicy, setPlacementPolicy] = useState<PlacementPolicy | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false)
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null)

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("deadline")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const router = useRouter()

  const [applicationData, setApplicationData] = useState<any[]>([])

  // Sort options
  const sortOptions = [
    { value: "deadline", label: "Application Deadline" },
    { value: "company", label: "Company Name" },
    { value: "salary", label: "Salary" },
    { value: "posted", label: "Posted Date" },
    { value: "title", label: "Job Title" },
  ]

  useEffect(() => {
    if (!student) {
      toast.error("Please log in to view jobs")
      router.push("/")
      return
    }
    // Fetch all data in parallel for faster loading
    fetchAllData()
  }, [student, router])

  useEffect(() => {
    filterJobs()
  }, [jobs, activeTab, studentProfile, applicationData, searchTerm, sortBy, sortOrder])

  // Combined fetch function for better performance
  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Prepare student profile immediately
      const profileData = { ...student } as StudentDetails
      if (profileData.college_reg_no) {
        profileData.college_reg_no = profileData.college_reg_no.toUpperCase()
      }
      setStudentProfile(profileData)

      // Fetch jobs, applications, and placement policy in parallel
      const [jobsResponse, applicationsResponse, policyResponse] = await Promise.allSettled([
        fetch('/api/admin/jobs'),
        fetch(`/api/student/applications?student_id=${profileData.college_reg_no}`),
        fetch('/api/admin/placement-policy')
      ])

      // Process jobs
      if (jobsResponse.status === 'fulfilled' && jobsResponse.value.ok) {
        const result = await jobsResponse.value.json()
        const jobsData = result.data || []
        const updatedJobs = updateExpiredJobs(jobsData)
        setJobs(updatedJobs)
      } else {
        setError('Failed to fetch jobs')
      }

      // Process applications
      let applicationsData = []
      if (applicationsResponse.status === 'fulfilled' && applicationsResponse.value.ok) {
        const result = await applicationsResponse.value.json()
        applicationsData = Array.isArray(result) ? result : result.data || []
      }
      setApplicationData(applicationsData)

      // Process placement policy
      if (policyResponse.status === 'fulfilled' && policyResponse.value.ok) {
        const policyResult = await policyResponse.value.json()
        const policyData = policyResult.data && policyResult.data.length > 0 ? policyResult.data[0] : null
        setPlacementPolicy(policyData)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    if (!studentProfile) {
      // Show all jobs regardless of status
      setFilteredJobs(applyFiltersAndSort(jobs))
      return
    }

    let filtered = jobs

    switch (activeTab) {
      case "eligible":
        // Get applied job IDs to exclude them from eligible jobs
        const appliedJobIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => 
          (job.status === "active" || job.status === "upcoming") && // Not expired or closed
          isEligibleForJob(job, studentProfile) &&
          !appliedJobIds.includes(job.id) // Not applied
        )
        break
      case "applied":
        // Show jobs that the student has applied to
        const studentAppliedJobIds = applicationData.map(app => app.job_id)
        filtered = jobs.filter(job => studentAppliedJobIds.includes(job.id))
        break
      case "closed":
        // Show expired and closed jobs
        filtered = jobs.filter(job => 
          job.status === "closed"
        )
        break
      default:
        // All Jobs - show ALL jobs regardless of status or application state
        filtered = jobs
    }

    setFilteredJobs(applyFiltersAndSort(filtered))
  }

  const applyFiltersAndSort = (jobsList: Job[]): Job[] => {
    let filtered = [...jobsList]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "company":
          comparison = a.company_name.localeCompare(b.company_name)
          break
        case "salary":
          const avgA = (a.package_min + a.package_max) / 2
          const avgB = (b.package_min + b.package_max) / 2
          comparison = avgA - avgB
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "posted":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "deadline":
        default:
          comparison = new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()
          break
      }
      
      return sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }

  const isEligibleForJob = (job: Job, student: StudentDetails): boolean => {
    if (job.min_ug_percentage && student.ug_percentage < job.min_ug_percentage) {
      return false
    }

    if (job.no_backlogs_required && student.active_backlogs) {
      return false
    }

    if (job.no_offer && placementPolicy && student.placement_status?.offers && student.placement_status.offers.length >= placementPolicy.max_offers_allowed) {
      return false
    }

    // Check placement policy rules (skip for no_offer jobs)
    if (!job.no_offer && placementPolicy && student.placement_status?.offers) {
      const currentOffers = student.placement_status.offers
      
      // Check max offers limit
      if (currentOffers.length >= placementPolicy.max_offers_allowed) {
        return false
      }
      
      // Check second offer multiplier rule for jobs that count as offers
      if (job.counts_as_offer && currentOffers.length > 0 && placementPolicy.second_offer_multiplier > 1) {
        const maxCurrentPackage = Math.max(...currentOffers.map((offer: any) => offer.package || 0))
        const requiredMinPackage = maxCurrentPackage * placementPolicy.second_offer_multiplier
        
        if (job.package_min < requiredMinPackage) {
          return false
        }
      }
    }

    if (job.branches_allowed && job.branches_allowed.length > 0) {
      if (!job.branches_allowed.includes(student.branch)) {
        return false
      }
    }

    // Check additional eligibility criteria
    if (job.min_tenth_percentage && student.tenth_percentage !== null && student.tenth_percentage !== undefined && student.tenth_percentage < job.min_tenth_percentage) {
      return false
    }

    if (job.min_twelfth_percentage && student.twelfth_percentage !== null && student.twelfth_percentage !== undefined && student.twelfth_percentage < job.min_twelfth_percentage) {
      return false
    }

    if (job.eligible_courses && job.eligible_courses.length > 0 && student.course) {
      if (!job.eligible_courses.includes(student.course)) {
        return false
      }
    }

    // Check graduation year from eligibility_criteria (still in JSONB)
    if (job.eligibility_criteria?.year_of_graduation && student.year_of_graduation !== job.eligibility_criteria.year_of_graduation) {
      return false
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

  const handleApplyNow = (job: Job) => {
    setSelectedJobForApplication(job)
    setIsApplicationDialogOpen(true)
  }

  const handleApplicationSuccess = () => {
    setIsApplicationDialogOpen(false)
    setSelectedJobForApplication(null)
    // Refresh the data to show the new application
    fetchAllData()
    toast.success("Application submitted successfully!", {
      duration: 3000, // Auto-fade after 3 seconds
    })
  }

    // Download resume function

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-center sm:text-left">
            Job Opportunities
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center sm:text-left">Find your perfect placement opportunity</p>
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-fit self-center sm:self-auto"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Refresh</span>
            </Button>
          </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <div className="flex flex-col space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              {/* Quick Sort */}
              {/* Sort By with integrated direction */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-2 sm:px-3"
                  title={sortOrder === "asc" ? "Switch to descending" : "Switch to ascending"}
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Tab List */}
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto p-1 bg-gray-100/50 dark:bg-gray-800/50">
              <TabsTrigger value="all" className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>All Jobs</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 py-0 min-w-[18px] h-4 sm:h-5">
                  {activeTab === "all" ? filteredJobs.length : jobs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="eligible" className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Eligible</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 py-0 min-w-[18px] h-4 sm:h-5">
                  {activeTab === "eligible" ? filteredJobs.length : jobs.filter(job => 
                    (job.status === "active" || job.status === "upcoming") && 
                    studentProfile && 
                    isEligibleForJob(job, studentProfile) &&
                    !applicationData.map(app => app.job_id).includes(job.id)
                  ).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="applied" className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Applied</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 py-0 min-w-[18px] h-4 sm:h-5">
                  {activeTab === "applied" ? filteredJobs.length : applicationData.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Closed</span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 py-0 min-w-[18px] h-4 sm:h-5">
                  {activeTab === "closed" ? filteredJobs.length : jobs.filter(job => job.status === "closed").length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

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
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => {
                  // Find application data for this job if we're on the applied tab
                  const application = activeTab === "applied" ? applicationData.find(app => app.job_id === job.id) : null
                  
                  return (
                    <Card
                      key={job.id}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1"
                    >
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg group-hover:text-blue-600 transition-colors truncate">
                                {job.title}
                              </CardTitle>
                              <CardDescription className="font-medium text-sm sm:text-base truncate">
                                {job.company_name}
                              </CardDescription>
                            </div>
                          </div>
                          {/* Show application status badge for applied jobs, job status for others */}
                          {application ? (
                            <Badge
                              className={`text-xs flex-shrink-0 ${
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
                                  ? "bg-gradient-to-r from-green-200 to-emerald-200 text-green-900 border-2 border-green-300 font-bold shadow-lg"
                                  : application.current_stage === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : application.current_stage === "withdrawn"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <span className="hidden sm:inline">
                                {application.current_stage.charAt(0).toUpperCase() + application.current_stage.slice(1).replace('_', ' ')}
                              </span>
                              <span className="sm:hidden">
                                {application.current_stage === "under_review" ? "Review" : 
                                 application.current_stage === "shortlisted" ? "Short" :
                                 application.current_stage === "interview" ? "Inter" :
                                 application.current_stage === "assessment" ? "Test" :
                                 application.current_stage === "final_review" ? "Final" :
                                 application.current_stage === "selected" ? "Select" :
                                 application.current_stage === "offered" ? "Offer" :
                                 application.current_stage === "placed" ? "Placed" :
                                 application.current_stage === "rejected" ? "Reject" :
                                 application.current_stage === "withdrawn" ? "Withdraw" :
                                 application.current_stage.charAt(0).toUpperCase() + application.current_stage.slice(1)
                                }
                              </span>
                            </Badge>
                          ) : (
                            <Badge
                              className={`text-xs flex-shrink-0 ${
                                job.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : job.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800"
                                  : job.status === "closed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {job.status === "closed" && job.application_deadline && new Date(job.application_deadline) < new Date() 
                                ? "Expired" 
                                : job.status}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Countdown Timer - show only for upcoming and active jobs */}
                        {(job.status === "upcoming" || job.status === "active") && job.application_deadline && (
                          <div className="flex justify-end mt-2">
                            <CountdownTimer deadline={job.application_deadline} />
                          </div>
                        )}
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
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {job.min_ug_percentage && studentProfile.ug_percentage < job.min_ug_percentage && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>UG percentage: Need {job.min_ug_percentage}%, have {studentProfile.ug_percentage}%</span></div>
                                )}
                                {job.min_tenth_percentage && studentProfile.tenth_percentage !== null && studentProfile.tenth_percentage !== undefined && studentProfile.tenth_percentage < job.min_tenth_percentage && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>10th percentage: Need {job.min_tenth_percentage}%, have {studentProfile.tenth_percentage}%</span></div>
                                )}
                                {job.min_twelfth_percentage && studentProfile.twelfth_percentage !== null && studentProfile.twelfth_percentage !== undefined && studentProfile.twelfth_percentage < job.min_twelfth_percentage && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>12th percentage: Need {job.min_twelfth_percentage}%, have {studentProfile.twelfth_percentage}%</span></div>
                                )}
                                {job.eligible_courses && job.eligible_courses.length > 0 && studentProfile.course && !job.eligible_courses.includes(studentProfile.course) && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Course not eligible: {studentProfile.course}</span></div>
                                )}
                                {job.eligibility_criteria?.year_of_graduation && studentProfile.year_of_graduation !== job.eligibility_criteria.year_of_graduation && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Graduation year: Need {job.eligibility_criteria.year_of_graduation}, have {studentProfile.year_of_graduation}</span></div>
                                )}
                                {job.no_backlogs_required && studentProfile.active_backlogs && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Active backlogs not allowed</span></div>
                                )}
                                {job.no_offer && placementPolicy && studentProfile.placement_status?.offers && studentProfile.placement_status.offers.length >= placementPolicy.max_offers_allowed && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Maximum offers limit reached ({studentProfile.placement_status.offers.length}/{placementPolicy.max_offers_allowed})</span></div>
                                )}
                                {!job.no_offer && placementPolicy && studentProfile.placement_status?.offers && studentProfile.placement_status.offers.length >= placementPolicy.max_offers_allowed && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Maximum offers limit reached ({studentProfile.placement_status.offers.length}/{placementPolicy.max_offers_allowed})</span></div>
                                )}
                                {!job.no_offer && placementPolicy && job.counts_as_offer && studentProfile.placement_status?.offers && studentProfile.placement_status.offers.length > 0 && placementPolicy.second_offer_multiplier > 1 && (() => {
                                  const maxCurrentPackage = Math.max(...studentProfile.placement_status.offers.map((offer: any) => offer.package || 0))
                                  const requiredMinPackage = maxCurrentPackage * placementPolicy.second_offer_multiplier
                                  return job.package_min < requiredMinPackage
                                })() && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Package too low: Need ₹{(Math.max(...studentProfile.placement_status.offers.map((offer: any) => offer.package || 0)) * placementPolicy.second_offer_multiplier / 100000).toFixed(1)}L minimum for next offer</span></div>
                                )}
                                {job.branches_allowed && job.branches_allowed.length > 0 && !job.branches_allowed.includes(studentProfile.branch) && (
                                  <div className="flex items-start gap-2"><span className="text-red-500">•</span><span>Branch not eligible: {studentProfile.branch}</span></div>
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
                                ) : application.current_stage === "placed" ? (
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                                    <span className="text-lg">🎉</span>
                                  </div>
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
                              {application.current_stage === "selected" && "Selected! Waiting for offer details"}
                              {application.current_stage === "offered" && "Job offer received! Review and accept"}
                              {application.current_stage === "placed" && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-3 rounded-lg mt-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-800 mb-1">Congratulations!</div>
                                    <div className="text-sm text-green-700">You have been successfully placed!</div>
                                  </div>
                                </div>
                              )}
                              {application.current_stage === "rejected" && "Application not selected this time"}
                              {application.current_stage === "withdrawn" && "Application was withdrawn"}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <div className="flex items-center space-x-1 text-sm text-green-600">
                            <IndianRupee className="w-4 h-4" />
                            <span className="truncate">{(job.package_min / 100000).toFixed(1)}L - {(job.package_max / 100000).toFixed(1)}L</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="truncate">
                              {job.application_deadline 
                                ? new Date(job.application_deadline).toLocaleDateString()
                                : "No deadline"
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-blue-600">
                            <GraduationCap className="w-4 h-4" />
                            <span className="truncate">UG: {job.min_ug_percentage}%</span>
                          </div>
                          {job.min_tenth_percentage ? (
                            <div className="flex items-center space-x-1 text-sm text-purple-600">
                              <GraduationCap className="w-4 h-4" />
                              <span className="truncate">10th: {job.min_tenth_percentage}%</span>
                            </div>
                          ) : job.min_twelfth_percentage ? (
                            <div className="flex items-center space-x-1 text-sm text-indigo-600">
                              <GraduationCap className="w-4 h-4" />
                              <span className="truncate">12th: {job.min_twelfth_percentage}%</span>
                            </div>
                          ) : job.eligibility_criteria?.year_of_graduation ? (
                            <div className="flex items-center space-x-1 text-sm text-teal-600">
                              <Calendar className="w-4 h-4" />
                              <span className="truncate">Grad: {job.eligibility_criteria.year_of_graduation}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span className="truncate">Open</span>
                            </div>
                          )}
                        </div>

                        {job.eligible_courses && job.eligible_courses.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Eligible Courses:</p>
                            <div className="flex flex-wrap gap-1">
                              {job.eligible_courses.map((course: string) => (
                                <Badge key={course} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  {course}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

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
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="w-full transition-all duration-200 hover:scale-105"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Track Application
                            </Button>
                          ) : activeTab === "available" && studentProfile && isEligibleForJob(job, studentProfile) && !applicationData.find(app => app.job_id === job.id) ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleApplyNow(job)}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                            >
                              <Briefcase className="w-4 h-4 mr-1" />
                              Apply Now
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
                    : activeTab === "closed"
                    ? "No closed jobs found."
                    : "No active jobs available at the moment."
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedJobForApplication && (
        <JobApplicationDialog
          job={selectedJobForApplication}
          isOpen={isApplicationDialogOpen}
          onClose={() => setIsApplicationDialogOpen(false)}
          onApplicationSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  )
}