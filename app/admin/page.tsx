"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { downloadResume } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTheme } from "@/contexts/theme-context"
import { supabaseClient, type StudentDetails, type Job, type GrievanceReport } from "@/lib/supabase"
import { toast } from "sonner"
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "@/components/ui/professional-toast"
import {
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  LogOut,
  Moon,
  Sun,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Search,
  GraduationCap,
  Calendar,
  IndianRupee,
  MessageSquare,
  BarChart3,
  Clock,
  UserX,
  User,
} from "lucide-react"

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<StudentDetails[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [grievances, setGrievances] = useState<GrievanceReport[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterVerification, setFilterVerification] = useState("all")
  const [filterJobStatus, setFilterJobStatus] = useState("all")
  const [selectedJobForExport, setSelectedJobForExport] = useState("all")
  const [selectedCompanyForReport, setSelectedCompanyForReport] = useState("")
  const [isDownloadingData, setIsDownloadingData] = useState(false)
  const [isCompanyReportOpen, setIsCompanyReportOpen] = useState(false)
  const [companyReportData, setCompanyReportData] = useState<any[]>([])
  const [isAddJobOpen, setIsAddJobOpen] = useState(false)
  const [isEditJobOpen, setIsEditJobOpen] = useState(false)
  const [isViewJobOpen, setIsViewJobOpen] = useState(false)
  const [isDeleteJobOpen, setIsDeleteJobOpen] = useState(false)
  const [isViewStudentOpen, setIsViewStudentOpen] = useState(false)
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false)
  const [isStatusChangeConfirmOpen, setIsStatusChangeConfirmOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{from: string, to: string} | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null)
  const [updateStatusForm, setUpdateStatusForm] = useState({
    status: "",
    company: "",
    package_amount: "",
    notes: ""
  })
  const [editJob, setEditJob] = useState({
    title: "",
    company_name: "",
    description: "",
    package_min: "",
    package_max: "",
    min_ug_percentage: "",
    min_tenth_percentage: "",
    min_twelfth_percentage: "",
    courses_allowed: [] as string[],
    year_of_graduation: "",
    branches_allowed: [] as string[],
    no_backlogs_required: true,
    no_offer: false,
    application_deadline: "",
    status: "upcoming" as "upcoming" | "active" | "closed",
    job_title: "",
  })
  const [isGrievanceDialogOpen, setIsGrievanceDialogOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceReport | null>(null)
  const [grievanceFilter, setGrievanceFilter] = useState<"all" | "submitted" | "resolved">("all")
  const [adminResponse, setAdminResponse] = useState("")
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingGrievances: 0,
    placedStudents: 0,
    averagePackage: 0,
  })
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache
  const [newJob, setNewJob] = useState({
    title: "",
    company_name: "",
    description: "",
    package_min: "",
    package_max: "",
    min_ug_percentage: "",
    min_tenth_percentage: "",
    min_twelfth_percentage: "",
    courses_allowed: [] as string[],
    year_of_graduation: "",
    branches_allowed: [] as string[],
    no_backlogs_required: true,
    no_offer: false,
    application_deadline: "",
    status: "upcoming" as "upcoming" | "active" | "closed",
    job_title: "",
  })
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const branches = [
    "Computer Science",
    "Information Technology",
    "Artificial Intelligence & Machine Learning",
    "Mathematics & Computing",
    "Electronics and Communication",
    "Electrical and Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Aerospace Engineering",
    "Robotics",
  ]

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const checkAdminAuth = () => {
    const adminSession = localStorage.getItem("admin_session")
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession)
        if (session.username === "admin") {
          setIsAuthenticated(true)
        } else {
          router.push("/")
        }
      } catch (error) {
        router.push("/")
      }
    } else {
      router.push("/")
    }
    setIsLoading(false)
  }

  const fetchData = async () => {
    try {
      console.log('� Fetching admin dashboard data (parallel)...')
      
      // Make all API calls in parallel for faster loading
      const [
        studentsResponse,
        jobsResponse,
        companiesResponse,
        grievancesResponse,
        applicationsResponse,
        activitiesResponse
      ] = await Promise.allSettled([
        fetch('/api/admin/students'),
        fetch('/api/admin/jobs'),
        fetch('/api/admin/company-report?get_companies=true'),
        fetch('/api/grievance'),
        fetch('/api/admin/applications'),
        fetch('/api/admin/activities')
      ])

      // Process students
      let allStudents: StudentDetails[] = []
      if (studentsResponse.status === 'fulfilled' && studentsResponse.value.ok) {
        const result = await studentsResponse.value.json()
        allStudents = result.data || []
        console.log('👥 Students fetched:', allStudents.length)
      } else {
        console.error('Failed to fetch students')
      }
      setStudents(allStudents)

      // Process jobs
      let allJobs: Job[] = []
      if (jobsResponse.status === 'fulfilled' && jobsResponse.value.ok) {
        const result = await jobsResponse.value.json()
        allJobs = result.data || []
        console.log('💼 Jobs fetched:', allJobs.length)
      } else {
        console.error('Failed to fetch jobs')
      }
      setJobs(allJobs)

      // Process companies
      let allCompanies: string[] = []
      if (companiesResponse.status === 'fulfilled' && companiesResponse.value.ok) {
        const result = await companiesResponse.value.json()
        allCompanies = result.companies || []
        console.log('🏢 Companies fetched:', allCompanies.length)
      } else {
        console.error('Failed to fetch companies')
      }
      setCompanies(allCompanies)

      // Process grievances
      let allGrievances: GrievanceReport[] = []
      if (grievancesResponse.status === 'fulfilled' && grievancesResponse.value.ok) {
        const result = await grievancesResponse.value.json()
        allGrievances = Array.isArray(result) ? result : result.data || []
        console.log('📝 Grievances fetched:', allGrievances.length)
      } else {
        console.error('Failed to fetch grievances')
      }
      setGrievances(allGrievances)

      // Process applications
      let allApplications: any[] = []
      if (applicationsResponse.status === 'fulfilled' && applicationsResponse.value.ok) {
        const result = await applicationsResponse.value.json()
        allApplications = result.applications || []
        console.log('📋 Applications fetched:', allApplications.length)
      } else {
        console.error('Failed to fetch applications')
      }

      // Process activities
      if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.ok) {
        const result = await activitiesResponse.value.json()
        setRecentActivities(result.data || [])
        console.log('🔔 Activities fetched:', result.data?.length || 0)
      } else {
        console.error('Failed to fetch activities')
      }

      // Calculate stats efficiently
      const placedCount = allStudents.filter(s => s.placement_status?.accepted_offers > 0).length
      const totalPackages = allStudents
        .filter(s => s.placement_status?.max_ctc > 0)
        .reduce((sum, s) => sum + (s.placement_status?.max_ctc || 0), 0)
      const avgPackage = placedCount > 0 ? totalPackages / placedCount / 100000 : 0
      const pendingGrievances = allGrievances.filter((g: GrievanceReport) => g.status === "submitted").length

      const calculatedStats = {
        totalStudents: allStudents.length,
        activeJobs: allJobs.filter(j => j.status === "active").length,
        totalApplications: allApplications.length,
        pendingGrievances,
        placedStudents: placedCount,
        averagePackage: Math.round(avgPackage * 10) / 10,
      }

      console.log('📊 Stats calculated in parallel:', calculatedStats)
      setStats(calculatedStats)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem("admin_session")
    toast.success("Signed out successfully", {
      description: "You have been logged out of the admin panel",
      duration: 2000,
    })
    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handleAddJob = async () => {
    setError(null)
    setSuccess(null)

    // Enhanced validation
    if (!newJob.title?.trim()) {
      toast.error("Job title is required", {
        description: "Please enter a valid job title",
        duration: 3000,
      })
      return
    }
    if (!newJob.company_name?.trim()) {
      toast.error("Company name is required", {
        description: "Please enter the company name",
        duration: 3000,
      })
      return
    }
    if (!newJob.description?.trim()) {
      toast.error("Job description is required", {
        description: "Please provide a detailed job description",
        duration: 3000,
      })
      return
    }
    if (newJob.branches_allowed.length === 0) {
      toast.error("Branch selection required", {
        description: "Please select at least one eligible branch",
        duration: 3000,
      })
      return
    }
    if (!newJob.min_ug_percentage || Number.parseFloat(newJob.min_ug_percentage) <= 0) {
      toast.error("Valid minimum UG percentage is required", {
        description: "Please enter a percentage between 1-100",
        duration: 3000,
      })
      return
    }
    if (!newJob.package_min || Number.parseFloat(newJob.package_min) <= 0) {
      toast.error("Valid minimum package is required", {
        description: "Please enter a valid salary amount",
        duration: 3000,
      })
      return
    }
    if (!newJob.package_max || Number.parseFloat(newJob.package_max) <= 0) {
      toast.error("Valid maximum package is required", {
        description: "Please enter a valid salary amount",
        duration: 3000,
      })
      return
    }
    if (Number.parseFloat(newJob.package_min) > Number.parseFloat(newJob.package_max)) {
      toast.error("Invalid package range", {
        description: "Minimum package cannot be greater than maximum package",
        duration: 3000,
      })
      return
    }

    const jobData = {
      title: newJob.title.trim(),
      company_name: newJob.company_name.trim(),
      company_logo: `/placeholder.svg?height=60&width=60&text=${newJob.company_name.trim().substring(0, 2).toUpperCase()}`,
      description: newJob.description.trim(),
      package_min: newJob.package_min ? Number.parseFloat(newJob.package_min) : null,
      package_max: newJob.package_max ? Number.parseFloat(newJob.package_max) : null,
      min_ug_percentage: Number.parseFloat(newJob.min_ug_percentage),
      min_tenth_percentage: newJob.min_tenth_percentage ? Number.parseFloat(newJob.min_tenth_percentage) : null,
      min_twelfth_percentage: newJob.min_twelfth_percentage ? Number.parseFloat(newJob.min_twelfth_percentage) : null,
      eligible_courses: newJob.courses_allowed.length > 0 ? newJob.courses_allowed : null,
      branches_allowed: newJob.branches_allowed,
      no_backlogs_required: newJob.no_backlogs_required,
      no_offer: newJob.no_offer,
      counts_as_offer: true,
      tpo: newJob.job_title?.trim() || null,
      eligibility_criteria: {
        experience: "0-2 years",
        backlogs_allowed: !newJob.no_backlogs_required,
        no_offer_required: newJob.no_offer,
        year_of_graduation: newJob.year_of_graduation ? parseInt(newJob.year_of_graduation) : null,
      },
      timeline: [
        { stage: "Application", date: newJob.application_deadline || "", description: "Submit application with resume" },
        { stage: "Review", date: "", description: "Application review process" },
        { stage: "Interview", date: "", description: "Interview rounds" },
        { stage: "Result", date: "", description: "Final selection results" },
      ],
      status: newJob.status,
      application_deadline: newJob.application_deadline ? new Date(newJob.application_deadline).toISOString() : null,
    }

    try {
      console.log("Creating job with data:", jobData)
      
      // Use server-side API route that has access to service role key
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })

      const result = await response.json()
      console.log("API response:", result)

      if (!response.ok) {
        console.error("API error:", result.error)
        toast.error("Failed to create job", {
          description: result.error || "Please check the job details and try again",
          duration: 4000,
        })
        return
      }

      // Update local state with the returned data
      if (result.data) {
        setJobs((prevJobs) => [...prevJobs, result.data])
      }
      setIsAddJobOpen(false)

      // Reset form
      setNewJob({
        title: "",
        company_name: "",
        description: "",
        package_min: "",
        package_max: "",
        min_ug_percentage: "",
        min_tenth_percentage: "",
        min_twelfth_percentage: "",
        courses_allowed: [],
        year_of_graduation: "",
        branches_allowed: [],
        no_backlogs_required: true,
        no_offer: false,
        application_deadline: "",
        status: "upcoming",
      job_title: "",
      })

      setError(null)
      toast.success("Job posted successfully!", {
        description: `${jobData.title} at ${jobData.company_name} has been created`,
        duration: 3000,
      })
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error adding job:", error)
      toast.error("Failed to create job", {
        description: error.message || "An unexpected error occurred. Please try again.",
        duration: 4000,
      })
    }
  }

  // Job management handlers
  const handleViewJob = (job: Job) => {
    setSelectedJob(job)
    setIsViewJobOpen(true)
  }

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    setEditJob({
      title: job.title,
      company_name: job.company_name,
      description: job.description,
      package_min: job.package_min?.toString() || "",
      package_max: job.package_max?.toString() || "",
      min_ug_percentage: job.min_ug_percentage?.toString() || "",
      min_tenth_percentage: job.min_tenth_percentage?.toString() || "",
      min_twelfth_percentage: job.min_twelfth_percentage?.toString() || "",
      courses_allowed: job.eligible_courses || [],
      year_of_graduation: job.eligibility_criteria?.year_of_graduation?.toString() || "",
      branches_allowed: job.branches_allowed || [],
      no_backlogs_required: job.no_backlogs_required || true,
      no_offer: job.no_offer || false,
      application_deadline: job.application_deadline ? new Date(job.application_deadline).toISOString().slice(0, 16) : "",
      status: job.status,
      job_title: job.tpo || "",
    })
    setIsEditJobOpen(true)
  }

  const handleDeleteJob = (job: Job) => {
    setSelectedJob(job)
    setIsDeleteJobOpen(true)
  }

  const confirmDeleteJob = async () => {
    if (!selectedJob) return

    try {
      const response = await fetch(`/api/admin/jobs?id=${selectedJob.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete job')
      }

      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id))
      setIsDeleteJobOpen(false)
      setSelectedJob(null)
      toast.success("Job deleted successfully!", {
        description: `${selectedJob.company_name} - ${selectedJob.title} has been removed`,
        duration: 3000
      })
      fetchData() // Refresh data including activities
    } catch (error: any) {
      setError(error.message || "Failed to delete job")
    }
  }

  const saveEditJob = async () => {
    if (!selectedJob) return

    setError(null)
    setSuccess(null)

    // Validation
    if (!editJob.title?.trim()) {
      setError("Job title is required")
      return
    }
    if (!editJob.company_name?.trim()) {
      setError("Company name is required")
      return
    }
    if (!editJob.description?.trim()) {
      setError("Job description is required")
      return
    }
    if (!editJob.package_min || Number.parseFloat(editJob.package_min) <= 0) {
      setError("Valid minimum package is required")
      return
    }
    if (!editJob.package_max || Number.parseFloat(editJob.package_max) <= 0) {
      setError("Valid maximum package is required")
      return
    }
    if (Number.parseFloat(editJob.package_min) > Number.parseFloat(editJob.package_max)) {
      setError("Minimum package cannot be greater than maximum package")
      return
    }

    const updatedJobData = {
      ...selectedJob,
      title: editJob.title.trim(),
      company_name: editJob.company_name.trim(),
      description: editJob.description.trim(),
      package_min: editJob.package_min ? Number.parseFloat(editJob.package_min) : null,
      package_max: editJob.package_max ? Number.parseFloat(editJob.package_max) : null,
      min_ug_percentage: Number.parseFloat(editJob.min_ug_percentage),
      min_tenth_percentage: editJob.min_tenth_percentage ? Number.parseFloat(editJob.min_tenth_percentage) : null,
      min_twelfth_percentage: editJob.min_twelfth_percentage ? Number.parseFloat(editJob.min_twelfth_percentage) : null,
      eligible_courses: editJob.courses_allowed.length > 0 ? editJob.courses_allowed : null,
      branches_allowed: editJob.branches_allowed,
      no_backlogs_required: editJob.no_backlogs_required,
      no_offer: editJob.no_offer,
      tpo: editJob.job_title?.trim() || null,
      eligibility_criteria: {
        ...selectedJob.eligibility_criteria,
        experience: "0-2 years",
        backlogs_allowed: !editJob.no_backlogs_required,
        no_offer_required: editJob.no_offer,
        year_of_graduation: editJob.year_of_graduation ? parseInt(editJob.year_of_graduation) : null,
      },
      application_deadline: editJob.application_deadline ? new Date(editJob.application_deadline).toISOString() : null,
      status: editJob.status,
      updated_at: new Date().toISOString(),
    }

    try {
      // Use server-side API route for updating job (to be implemented)
      const response = await fetch(`/api/admin/jobs/${selectedJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedJobData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job')
      }

      const result = await response.json()

      // Update local state
      setJobs(prevJobs => prevJobs.map(job => job.id === selectedJob.id ? result.data : job))
      setIsEditJobOpen(false)
      setSelectedJob(null)
      toast.success("Job updated successfully!", {
        description: `${result.data.company_name} - ${result.data.title} has been updated`,
        duration: 3000
      })
    } catch (error: any) {
      setError(error.message || "Failed to update job")
    }
  }

  const refreshGrievances = async () => {
    try {
      console.log('🔄 Fast refresh grievances only...')
      const response = await fetch('/api/grievance')
      if (response.ok) {
        const result = await response.json()
        const allGrievances = Array.isArray(result) ? result : result.data || []
        setGrievances(allGrievances)
        
        // Update pending grievances count in stats
        const pendingCount = allGrievances.filter((g: GrievanceReport) => g.status === "submitted").length
        setStats(prev => ({ ...prev, pendingGrievances: pendingCount }))
        console.log('✅ Grievances refreshed quickly')
      }
    } catch (error) {
      console.error('Error refreshing grievances:', error)
    }
  }

  const handleGrievanceResponse = async () => {
    if (!selectedGrievance || !adminResponse.trim()) {
      showErrorToast("Please provide a response")
      return
    }

    try {
      console.log('🔄 Updating grievance:', selectedGrievance.id)
      
      const response = await fetch('/api/grievance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedGrievance.id,
          status: "resolved",
          admin_response: adminResponse,
        }),
      })

      const result = await response.json()
      console.log('📝 API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update grievance')
      }

      // Update local state with the returned data
      const updatedGrievance = result.data || {
        ...selectedGrievance,
        status: "resolved" as const,
        admin_response: adminResponse,
        updated_at: new Date().toISOString(),
      }

      setGrievances(grievances.map((g) => (g.id === selectedGrievance.id ? updatedGrievance : g)))
      setIsGrievanceDialogOpen(false)
      setSelectedGrievance(null)
      setAdminResponse("")
      
      showSuccessToast("Grievance response sent successfully", {
        description: "The student will be notified of your response"
      })
      
      // Fast refresh only grievances data for better performance
      await refreshGrievances()
    } catch (error) {
      console.error("Error updating grievance:", error)
      showErrorToast("Failed to send response", {
        description: error instanceof Error ? error.message : "Please try again or contact support"
      })
    }
  }

  const exportStudentData = () => {
    try {
      const csvContent = [
        [
          "Name", 
          "Registration No", 
          "College Email", 
          "Personal Email",
          "Mobile", 
          "Gender",
          "Date of Birth",
          "Branch", 
          "Course",
          "UG Percentage", 
          "10th Percentage",
          "12th Percentage",
          "Year of Graduation",
          "Current Location",
          "Active Backlogs", 
          "PWD Status",
          "Resume Status",
          "Verification Status",
          "Placement Status",
          "Current Offers",
          "Accepted Offers",
          "Max CTC (₹L)",
          "Max Offers Allowed",
          "Created Date",
          "Updated Date"
        ].join(","),
        ...students.map((student) =>
          [
            `"${student.first_name}"`,
            student.college_reg_no,
            student.college_email,
            student.personal_email || "",
            student.mobile_number,
            student.gender,
            student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : "",
            `"${student.branch}"`,
            student.course || "",
            student.ug_percentage,
            student.tenth_percentage || "",
            student.twelfth_percentage || "",
            student.year_of_graduation || "",
            student.current_location || "",
            student.active_backlogs ? "Yes" : "No",
            student.pwd ? "Yes" : "No",
            student.resume_url ? "Uploaded" : "Not Uploaded",
            student.verification_status || "pending_verification",
            student.placement_status ? "Active" : "Not Active",
            student.placement_status?.offers?.length || 0,
            student.placement_status?.accepted_offers || 0,
            student.placement_status?.max_ctc ? (student.placement_status.max_ctc / 100000).toFixed(1) : "0",
            student.placement_status?.max_offers_allowed || 0,
            new Date(student.created_at).toLocaleDateString('en-IN'),
            new Date(student.updated_at).toLocaleDateString('en-IN')
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `students-data-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Student data exported successfully!", {
        description: `Downloaded ${students.length} student records as CSV`,
        duration: 3000,
      })
    } catch (error) {
      toast.error("Failed to export student data", {
        description: "Please try again or contact support",
        duration: 4000,
      })
    }
  }

  // Student management handlers
  const handleViewStudent = (student: StudentDetails) => {
    setSelectedStudent(student)
    setIsViewStudentOpen(true)
  }

  const handleDownloadResume = async (student: StudentDetails) => {
    if (!student.resume_url) {
      toast.error("Resume not available for this student", {
        duration: 4000, // Auto-fade after 4 seconds
      })
      return
    }

    try {
      // Use the admin API endpoint for resume download
      const response = await fetch(`/api/admin/resume/download?regNo=${encodeURIComponent(student.college_reg_no)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to download resume: ${response.status}`)
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${student.first_name}_${student.college_reg_no}_resume.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Resume downloaded successfully", {
        duration: 3000, // Auto-fade after 3 seconds
      })
    } catch (error) {
      console.error("Error downloading resume:", error)
      toast.error("Failed to download resume", {
        duration: 4000, // Auto-fade after 4 seconds
      })
    }
  }

  const handleUpdateStudentStatus = (student: StudentDetails) => {
    setSelectedStudent(student)
    setUpdateStatusForm({
      status: student.placement_status.accepted_offers > 0 ? "placed" : "active",
      company: "",
      package_amount: student.placement_status.max_ctc?.toString() || "",
      notes: ""
    })
    setIsUpdateStatusOpen(true)
  }

  const saveStudentStatusUpdate = async () => {
    if (!selectedStudent) return

    try {
      const isChangingToActive = updateStatusForm.status === "active"
      const wasPlaced = selectedStudent.placement_status.accepted_offers > 0
      
      const response = await fetch('/api/admin/update-student-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          status: updateStatusForm.status,
          company: updateStatusForm.company,
          package_amount: parseFloat(updateStatusForm.package_amount) || 0,
          notes: updateStatusForm.notes,
          clear_offers: isChangingToActive && wasPlaced // Clear offers if changing from placed to active
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update student status')
      }

      setIsUpdateStatusOpen(false)
      setSelectedStudent(null)
      toast.success("Student status updated successfully!", {
        description: "The student's placement status has been updated",
        duration: 3000
      })
      fetchData() // Refresh data
    } catch (error: any) {
      setError(error.message || "Failed to update student status")
    }
  }

  const exportJobData = () => {
    try {
      let jobsToExport = jobs
      if (selectedJobForExport !== "all") {
        jobsToExport = jobs.filter((job) => job.id === selectedJobForExport)
      }

      const csvContent = [
        [
          "Job ID",
          "Job Title",
          "Company",
          "Package Range (₹L)",
          "Package Min (₹L)",
          "Package Max (₹L)",
          "Min UG Percentage",
          "Min 10th Percentage",
          "Min 12th Percentage",
          "Eligible Courses",
          "Graduation Year Requirement",
          "Status",
          "Application Deadline",
          "Eligible Branches",
          "No Backlogs Required",
          "No Prior Offer Required",
          "TPO",
          "Counts As Offer",
          "Created Date",
          "Updated Date"
        ].join(","),
        ...jobsToExport.map((job) =>
          [
            job.id,
            `"${job.title}"`,
            `"${job.company_name}"`,
            `"₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L"`,
            (job.package_min / 100000).toFixed(1),
            (job.package_max / 100000).toFixed(1),
            job.min_ug_percentage,
            job.min_tenth_percentage || "",
            job.min_twelfth_percentage || "",
            job.eligible_courses ? `"${job.eligible_courses.join(', ')}"` : "",
            job.eligibility_criteria?.year_of_graduation || "",
            job.status.toUpperCase(),
            new Date(job.application_deadline).toLocaleDateString('en-IN'),
            `"${job.branches_allowed.join(', ')}"`,
            job.no_backlogs_required ? 'Yes' : 'No',
            job.no_offer ? 'Yes' : 'No',
            job.tpo || "",
            job.counts_as_offer ? 'Yes' : 'No',
            new Date(job.created_at || Date.now()).toLocaleDateString('en-IN'),
            new Date(job.updated_at || Date.now()).toLocaleDateString('en-IN')
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `jobs-data-${selectedJobForExport === "all" ? "all" : "selected"}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Job data exported successfully!", {
        description: `Downloaded ${jobsToExport.length} job${jobsToExport.length === 1 ? '' : 's'} as CSV`,
        duration: 3000,
      })
    } catch (error) {
      toast.error("Failed to export job data", {
        description: "Please try again or contact support",
        duration: 4000,
      })
    }
  }

  const generatePlacementReport = () => {
    const reportData = {
      totalStudents: stats.totalStudents,
      placedStudents: stats.placedStudents,
      placementRate: stats.totalStudents > 0 ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0,
      averagePackage: stats.averagePackage,
      branchWiseData: branches.map((branch) => {
        const branchStudents = students.filter((s) => s.branch === branch)
        const branchPlaced = branchStudents.filter((s) => s.placement_status.accepted_offers > 0)
        return {
          branch,
          total: branchStudents.length,
          placed: branchPlaced.length,
          rate: branchStudents.length > 0 ? Math.round((branchPlaced.length / branchStudents.length) * 100) : 0,
        }
      }),
      companyWiseData: jobs.map((job) => ({
        company: job.company_name,
        position: job.title,
        package: job.package_min === job.package_max 
          ? `₹${(job.package_min / 100000).toFixed(1)}L`
          : `₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L`,
        status: job.status,
        eligibility: {
          minUG: job.min_ug_percentage,
          min10th: job.min_tenth_percentage,
          min12th: job.min_twelfth_percentage,
          courses: job.eligible_courses,
          gradYear: job.eligibility_criteria?.year_of_graduation
        }
      })),
      placedStudentDetails: students.filter(s => s.placement_status.accepted_offers > 0).map(student => ({
        name: student.first_name,
        regNo: student.college_reg_no,
        branch: student.branch,
        course: student.course,
        ugPercentage: student.ug_percentage,
        tenthPercentage: student.tenth_percentage,
        twelfthPercentage: student.twelfth_percentage,
        graduationYear: student.year_of_graduation,
        maxCTC: student.placement_status.max_ctc,
        totalOffers: student.placement_status.offers?.length || 0,
        acceptedOffers: student.placement_status.accepted_offers
      })),
    }

    const reportContent = `
CAMPUS PLACEMENT REPORT
Generated on: ${new Date().toLocaleDateString()}

OVERALL STATISTICS
==================
Total Students: ${reportData.totalStudents}
Placed Students: ${reportData.placedStudents}
Placement Rate: ${reportData.placementRate}%
Average Package: ₹${reportData.averagePackage.toFixed(1)}L

BRANCH-WISE PLACEMENT DATA
==========================
${reportData.branchWiseData
  .map((branch) => `${branch.branch}: ${branch.placed}/${branch.total} (${branch.rate}%)`)
  .join("\n")}

COMPANY-WISE DATA WITH ELIGIBILITY CRITERIA
============================================
${reportData.companyWiseData
  .map((company) => `${company.company} - ${company.position}
  Package: ${company.package}
  Status: ${company.status}
  Min UG: ${company.eligibility.minUG}%
  Min 10th: ${company.eligibility.min10th || 'N/A'}%
  Min 12th: ${company.eligibility.min12th || 'N/A'}%
  Courses: ${company.eligibility.courses ? company.eligibility.courses.join(', ') : 'All'}
  Grad Year: ${company.eligibility.gradYear || 'Any'}
  `)
  .join("\n")}

PLACED STUDENT DETAILS
======================
${reportData.placedStudentDetails
  .map((student) => `${student.name} (${student.regNo})
  Branch: ${student.branch} | Course: ${student.course || 'N/A'}
  UG: ${student.ugPercentage}% | 10th: ${student.tenthPercentage || 'N/A'}% | 12th: ${student.twelfthPercentage || 'N/A'}%
  Graduation Year: ${student.graduationYear || 'N/A'}
  Max CTC: ₹${student.maxCTC ? (student.maxCTC / 100000).toFixed(1) : '0'}L
  Total Offers: ${student.totalOffers} | Accepted: ${student.acceptedOffers}
  `)
  .join("\n")}
    `.trim()

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `placement-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Placement report generated successfully!", {
      description: `Report includes data for ${reportData.totalStudents} students and ${reportData.branchWiseData.length} branches`,
      duration: 3000,
    })
  }

  // Company-wise report generation
  const generateCompanyReport = async (company: string = "all") => {
    try {
      // Validate company selection
      if (!company || company === "") {
        toast.error("Please select a company to generate report for", {
          description: "Choose a specific company or 'All Companies' from the dropdown",
          duration: 4000,
        })
        return
      }

      const response = await fetch(`/api/admin/company-report?company=${encodeURIComponent(company)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch company report')
      }
      const result = await response.json()
      // Ensure we always have an array for companyReportData
      setCompanyReportData(result.data || result || [])
      setIsCompanyReportOpen(true)
    } catch (error) {
      console.error('Error generating company report:', error)
      toast.error('Failed to generate company report')
    }
  }

  const exportCompanyReport = (company: string = "all") => {
    let dataToExport = companyReportData
    if (company !== "all") {
      dataToExport = companyReportData.filter((item) => item.company_name === company)
    }

    const csvContent = [
      [
        "Company", 
        "Job Title", 
        "Student Name", 
        "Registration No", 
        "College Email",
        "Personal Email",
        "Mobile",
        "Gender",
        "Branch", 
        "Course",
        "UG Percentage",
        "10th Percentage", 
        "12th Percentage",
        "Year of Graduation",
        "Current Location",
        "Active Backlogs",
        "PWD Status",
        "Application Status", 
        "Package (₹L)",
        "Applied Date",
        "Current Stage"
      ].join(","),
      ...dataToExport.map((item) =>
        [
          `"${item.company_name}"`,
          `"${item.job_title}"`,
          `"${item.student_name}"`,
          item.student_reg_no,
          item.college_email || "",
          item.personal_email || "",
          item.mobile_number || "",
          item.gender || "",
          `"${item.branch}"`,
          item.course || "",
          item.ug_percentage || "",
          item.tenth_percentage || "",
          item.twelfth_percentage || "",
          item.year_of_graduation || "",
          item.current_location || "",
          item.active_backlogs ? "Yes" : "No",
          item.pwd ? "Yes" : "No",
          item.status || "",
          item.package ? `${(item.package / 100000).toFixed(1)}` : "N/A",
          item.applied_at ? new Date(item.applied_at).toLocaleDateString('en-IN') : "",
          item.current_stage || ""
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `company-report-${company === "all" ? "all" : company}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download student data with resumes as ZIP file
  const downloadStudentDataWithResumes = async (company: string = "all") => {
    if (isDownloadingData) return // Prevent multiple simultaneous downloads
    
    try {
      // Validate company selection - ensure user has made a conscious choice
      if (!company || company === "" || company === "select") {
        toast.error("Please select a company to download data for", {
          description: "Choose a specific company or 'All Companies' from the dropdown",
          duration: 4000,
        })
        return
      }

      setIsDownloadingData(true)

      const loadingToast = toast.loading(`Preparing download for ${company === "all" ? "all companies" : company}...`, {
        description: "This may take a few moments while we gather student data and resumes",
      })
      
      const response = await fetch(`/api/admin/download-student-data?company=${encodeURIComponent(company)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.dismiss(loadingToast)
        toast.error(errorData.error || 'Failed to download student data')
        return
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `student_data_${company}_${new Date().toISOString().split('T')[0]}.zip`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.dismiss(loadingToast)
      toast.success("Download completed successfully!", {
        description: `Student data and resumes for ${company === "all" ? "all companies" : company} downloaded`,
        duration: 4000,
      })
      
    } catch (error) {
      console.error('Error downloading student data:', error)
      toast.error((error as Error).message || 'Failed to download student data with resumes')
    } finally {
      setIsDownloadingData(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college_reg_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBranch = filterBranch === "all" || student.branch === filterBranch
    const matchesVerification = filterVerification === "all" || 
      (filterVerification === "pending" && (!student.resume_url)) ||
      (filterVerification === "verified" && (student.resume_url && student.college_email && student.personal_email)) ||
      (filterVerification === "incomplete" && (!student.college_email || !student.personal_email || !student.first_name || !student.mobile_number))
    return matchesSearch && matchesBranch && matchesVerification
  })

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterJobStatus === "all" || job.status === filterJobStatus
    return matchesStatus
  })

  const filteredGrievances = grievances
    .filter((grievance) => {
      const matchesSearch =
        grievance.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grievance.student_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grievance.issue_type.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = 
        grievanceFilter === "all" || 
        (grievanceFilter === "submitted" && grievance.status === "submitted") ||
        (grievanceFilter === "resolved" && grievance.status === "resolved")
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      // Sort submitted first, then resolved, then others
      if (a.status === "submitted" && b.status !== "submitted") return -1
      if (b.status === "submitted" && a.status !== "submitted") return 1
      if (a.status === "resolved" && b.status !== "resolved" && b.status !== "submitted") return -1
      if (b.status === "resolved" && a.status !== "resolved" && a.status !== "submitted") return 1
      return 0
    })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Admin Portal
                  </h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="transition-all duration-200"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Manage placement activities and student applications</p>
          </div>
          <Button 
            onClick={() => fetchData()} 
            variant="outline" 
            className="ml-4 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Currently open positions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">All time applications</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placed Students</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.placedStudents}</div>
              <p className="text-xs text-muted-foreground">Successfully placed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Package</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{stats.averagePackage.toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">Per annum</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Grievances</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.pendingGrievances}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="grievances">Grievances</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system activities and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No recent activities</div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Job</DialogTitle>
                        <DialogDescription>Create a new job posting for students</DialogDescription>
                      </DialogHeader>
                      
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      {success && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>{success}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                              id="title"
                              value={newJob.title}
                              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                              placeholder="Software Developer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company Name *</Label>
                            <Input
                              id="company"
                              value={newJob.company_name}
                              onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                              placeholder="TechCorp Solutions"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Job Description *</Label>
                          <Textarea
                            id="description"
                            value={newJob.description}
                            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                            placeholder="Describe the job role, responsibilities, and requirements..."
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="packageMin">Package Min (₹)</Label>
                            <Input
                              id="packageMin"
                              type="number"
                              value={newJob.package_min}
                              onChange={(e) => setNewJob({ ...newJob, package_min: e.target.value })}
                              placeholder="600000"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packageMax">Package Max (₹)</Label>
                            <Input
                              id="packageMax"
                              type="number"
                              value={newJob.package_max}
                              onChange={(e) => setNewJob({ ...newJob, package_max: e.target.value })}
                              placeholder="1200000"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minPercentage">Min UG Percentage</Label>
                            <Input
                              id="minPercentage"
                              type="number"
                              step="0.01"
                              value={newJob.min_ug_percentage}
                              onChange={(e) => setNewJob({ ...newJob, min_ug_percentage: e.target.value })}
                              placeholder="70.0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Backlogs Allowed?</Label>
                            <Select
                              value={newJob.no_backlogs_required ? "no" : "yes"}
                              onValueChange={(value) => 
                                setNewJob({ ...newJob, no_backlogs_required: value === "no" })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select backlogs criteria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no">No Backlogs Required</SelectItem>
                                <SelectItem value="yes">Backlogs Allowed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>No Offer ?</Label>
                          <Select
                            value={newJob.no_offer ? "yes" : "no"}
                            onValueChange={(value) => 
                              setNewJob({ ...newJob, no_offer: value === "yes" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select offer criteria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minTenthPercentage">Min 10th Percentage</Label>
                            <Input
                              id="minTenthPercentage"
                              type="number"
                              step="0.01"
                              value={newJob.min_tenth_percentage}
                              onChange={(e) => setNewJob({ ...newJob, min_tenth_percentage: e.target.value })}
                              placeholder="60.0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="minTwelfthPercentage">Min 12th Percentage</Label>
                            <Input
                              id="minTwelfthPercentage"
                              type="number"
                              step="0.01"
                              value={newJob.min_twelfth_percentage}
                              onChange={(e) => setNewJob({ ...newJob, min_twelfth_percentage: e.target.value })}
                              placeholder="65.0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Eligible Courses</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                              {["B.Tech", "B.Sc", "M.Tech", "M.Sc", "MBA", "MCA"].map((course) => (
                                <label key={course} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={newJob.courses_allowed.includes(course)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewJob({
                                          ...newJob,
                                          courses_allowed: [...newJob.courses_allowed, course],
                                        })
                                      } else {
                                        setNewJob({
                                          ...newJob,
                                          courses_allowed: newJob.courses_allowed.filter((c) => c !== course),
                                        })
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{course}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="yearOfGraduation">Year of Graduation</Label>
                            <Select
                              value={newJob.year_of_graduation}
                              onValueChange={(value) => setNewJob({ ...newJob, year_of_graduation: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select graduation year" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => {
                                  const year = new Date().getFullYear() + i
                                  return (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="status">Job Status</Label>
                            <Select
                              value={newJob.status}
                              onValueChange={(value: "upcoming" | "active" | "closed") => 
                                setNewJob({ ...newJob, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deadline">Application Deadline</Label>
                            <Input
                              id="deadline"
                              type="datetime-local"
                              value={newJob.application_deadline}
                              onChange={(e) => setNewJob({ ...newJob, application_deadline: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Eligible Branches</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {branches.map((branch) => (
                              <label key={branch} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newJob.branches_allowed.includes(branch)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewJob({
                                        ...newJob,
                                        branches_allowed: [...newJob.branches_allowed, branch],
                                      })
                                    } else {
                                      setNewJob({
                                        ...newJob,
                                        branches_allowed: newJob.branches_allowed.filter((b) => b !== branch),
                                      })
                                    }
                                  }}
                                />
                                <span className="text-sm">{branch}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tpoName">TPO Name</Label>
                          <Input
                            id="tpoName"
                            value={newJob.job_title}
                            onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                            placeholder="TPO name or contact person..."
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddJobOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddJob}>Add Job</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-600"
                    onClick={() => router.push('/admin/applications')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Applications
                  </Button>

                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={exportStudentData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Student Data
                  </Button>

                  <div className="flex gap-2 items-start">
                    <Select value={selectedJobForExport} onValueChange={setSelectedJobForExport}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="All Jobs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.company_name.length > 10 ? job.company_name.substring(0, 10) + '...' : job.company_name} - {job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="flex-shrink-0" onClick={exportJobData}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export Job Data
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={generatePlacementReport}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Placement Report
                  </Button>

                  {/* Additional Quick Actions */}
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Actions</p>
                    <div className="space-y-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={async () => {
                          try {
                            await fetchData()
                            toast.success('Data refreshed successfully')
                          } catch (error) {
                            toast.error('Failed to refresh data')
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Job Management</h2>
              <div className="flex gap-4 items-center">
                <Select value={filterJobStatus} onValueChange={setFilterJobStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="font-medium">{job.company_name}</CardDescription>
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
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{job.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-green-600" />
                          <span className="text-gray-600">Package:</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          ₹{(job.package_min / 100000).toFixed(1)}L - ₹{(job.package_max / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-600">Min. Grade:</span>
                        </div>
                        <span className="font-semibold text-blue-600">{job.min_ug_percentage}%</span>
                      </div>
                      {job.min_tenth_percentage && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-600">Min 10th%:</span>
                          </div>
                          <span className="font-semibold text-purple-600">{job.min_tenth_percentage}%</span>
                        </div>
                      )}
                      {job.min_twelfth_percentage && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-600" />
                            <span className="text-gray-600">Min 12th%:</span>
                          </div>
                          <span className="font-semibold text-indigo-600">{job.min_twelfth_percentage}%</span>
                        </div>
                      )}
                      {job.eligibility_criteria?.year_of_graduation && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span className="text-gray-600">Grad Year:</span>
                          </div>
                          <span className="font-semibold text-teal-600">{job.eligibility_criteria.year_of_graduation}</span>
                        </div>
                      )}
                      {job.tpo && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-600">TPO:</span>
                          </div>
                          <span className="font-semibold text-gray-600">{job.tpo}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span className="text-gray-600">Deadline:</span>
                        </div>
                        <span className="font-semibold text-orange-600">
                          {new Date(job.application_deadline).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Eligible Branches:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.branches_allowed.slice(0, 3).map((branch) => (
                          <Badge key={branch} variant="outline" className="text-xs">
                            {branch}
                          </Badge>
                        ))}
                        {job.branches_allowed.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.branches_allowed.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {job.eligible_courses && job.eligible_courses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Eligible Courses:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.eligible_courses.slice(0, 2).map((course: string) => (
                            <Badge key={course} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {course}
                            </Badge>
                          ))}
                          {job.eligible_courses.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.eligible_courses.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteJob(job)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No jobs found matching the current filter</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Student Management</h2>
              <Button variant="outline" onClick={exportStudentData}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterVerification} onValueChange={setFilterVerification}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="incomplete">Incomplete Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
            <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Student</th>
                        <th className="p-4 font-medium">Registration No</th>
                        <th className="p-4 font-medium">Branch</th>
                        <th className="p-4 font-medium">Percentage</th>
                        <th className="p-4 font-medium">Resume</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{student.first_name}</div>
                              <div className="text-sm text-gray-500">{student.college_email}</div>
                            </div>
                          </td>
                          <td className="p-4 font-mono">{student.college_reg_no}</td>
                          <td className="p-4">{student.branch}</td>
                          <td className="p-4">{student.ug_percentage}%</td>
                          <td className="p-4">
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
                          </td>
                          <td className="p-4">
                            {student.placement_status.accepted_offers > 0 ? (
                              <Badge className="bg-green-100 text-green-800">Placed</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleUpdateStudentStatus(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found matching the current search</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grievances" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Grievance Management</h2>
              <Badge variant="destructive">{stats.pendingGrievances} Pending</Badge>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search grievances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={grievanceFilter} onValueChange={(value: "all" | "submitted" | "resolved") => setGrievanceFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grievances</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grievances List */}
            <div className="space-y-4">
              {filteredGrievances.map((grievance) => (
                <Card
                  key={grievance.id}
                  className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{grievance.issue_type}</CardTitle>
                        <CardDescription>
                          {grievance.student_name} ({grievance.student_reg_no})
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          grievance.status === "submitted"
                            ? "bg-red-100 text-red-800"
                            : grievance.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {grievance.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Issue Description:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{grievance.message}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Contact: {grievance.contact_email}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(grievance.created_at).toLocaleDateString()}</span>
                    </div>

                    {grievance.admin_response && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{grievance.admin_response}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      {grievance.status !== "resolved" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedGrievance(grievance)
                            setAdminResponse(grievance.admin_response || "")
                            setIsGrievanceDialogOpen(true)
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Respond
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredGrievances.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No grievances found</p>
              </div>
            )}

            {/* Grievance Response Dialog */}
            <Dialog open={isGrievanceDialogOpen} onOpenChange={setIsGrievanceDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Respond to Grievance</DialogTitle>
                  <DialogDescription>
                    Provide a response to {selectedGrievance?.student_name}'s grievance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Issue:</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedGrievance?.message}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="response">Admin Response</Label>
                    <Textarea
                      id="response"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Provide your response to the student..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsGrievanceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGrievanceResponse}>Send Response</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Placement Statistics</CardTitle>
                  <CardDescription>Overall placement performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Placement Rate</span>
                      <span className="font-medium">
                        {stats.totalStudents > 0 ? Math.round((stats.placedStudents / stats.totalStudents) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${stats.totalStudents > 0 ? (stats.placedStudents / stats.totalStudents) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.placedStudents}</div>
                      <div className="text-sm text-gray-600">Placed</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.totalStudents - stats.placedStudents}
                      </div>
                      <div className="text-sm text-gray-600">Seeking</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Branch-wise Distribution</CardTitle>
                  <CardDescription>Student distribution across branches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {branches.map((branch) => {
                      const count = students.filter((s) => s.branch === branch).length
                      const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0
                      return (
                        <div key={branch} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate mr-2">{branch}</span>
                            <span className="font-mono text-xs">{count} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Company-wise Reports</CardTitle>
                <CardDescription>Generate reports based on company applications and placements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <Select value={selectedCompanyForReport} onValueChange={setSelectedCompanyForReport}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => generateCompanyReport(selectedCompanyForReport)}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    View detailed information about student applications and placements for specific companies or all companies.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download various reports and data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={exportStudentData} className="justify-start bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Student Data (CSV)
                  </Button>
                  <Button variant="outline" onClick={exportJobData} className="justify-start bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Job Data (CSV)
                  </Button>
                  <Button variant="outline" onClick={generatePlacementReport} className="justify-start bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Placement Report (TXT)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Job Management Dialogs */}
        
        {/* View Job Dialog */}
        <Dialog open={isViewJobOpen} onOpenChange={setIsViewJobOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Job Title</Label>
                    <p className="text-lg">{selectedJob.title}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Company</Label>
                    <p className="text-lg">{selectedJob.company_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <Badge className={
                      selectedJob.status === "active"
                        ? "bg-green-100 text-green-800"
                        : selectedJob.status === "upcoming"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }>
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Application Deadline</Label>
                    <p>{selectedJob.application_deadline ? new Date(selectedJob.application_deadline).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Description</Label>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{selectedJob.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Package Range</Label>
                    <p>{selectedJob.package_min === selectedJob.package_max
                      ? `₹${selectedJob.package_min ? (selectedJob.package_min / 100000).toFixed(1) : '0'}L`
                      : `₹${selectedJob.package_min ? (selectedJob.package_min / 100000).toFixed(1) : '0'}L - ₹${selectedJob.package_max ? (selectedJob.package_max / 100000).toFixed(1) : '0'}L`
                    }</p>
                  </div>
                  <div>
                    <Label className="font-medium">Minimum UG Percentage</Label>
                    <p>{selectedJob.min_ug_percentage}%</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Eligible Branches</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedJob.branches_allowed?.map((branch) => (
                      <Badge key={branch} variant="outline">{branch}</Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Eligibility Criteria */}
                {(selectedJob.min_tenth_percentage || selectedJob.min_twelfth_percentage || (selectedJob.eligible_courses && selectedJob.eligible_courses.length > 0) || selectedJob.eligibility_criteria?.year_of_graduation) && (
                  <div className="border-t pt-4">
                    <Label className="font-medium text-lg">Additional Eligibility Requirements</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {selectedJob.min_tenth_percentage && (
                        <div>
                          <Label className="font-medium">Minimum 10th Percentage</Label>
                          <p>{selectedJob.min_tenth_percentage}%</p>
                        </div>
                      )}
                      {selectedJob.min_twelfth_percentage && (
                        <div>
                          <Label className="font-medium">Minimum 12th Percentage</Label>
                          <p>{selectedJob.min_twelfth_percentage}%</p>
                        </div>
                      )}
                      {selectedJob.eligibility_criteria?.year_of_graduation && (
                        <div>
                          <Label className="font-medium">Graduation Year</Label>
                          <p>{selectedJob.eligibility_criteria.year_of_graduation}</p>
                        </div>
                      )}
                    </div>
                    {selectedJob.eligible_courses && selectedJob.eligible_courses.length > 0 && (
                      <div className="mt-4">
                        <Label className="font-medium">Eligible Courses</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedJob.eligible_courses.map((course: string) => (
                            <Badge key={course} variant="outline" className="bg-blue-50 text-blue-700">{course}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedJob.tpo && (
                  <div>
                    <Label className="font-medium">TPO Contact</Label>
                    <p>{selectedJob.tpo}</p>
                  </div>
                )}
                
                <div>
                  <Label className="font-medium">Backlogs Policy</Label>
                  <p>{selectedJob.no_backlogs_required ? 'No backlogs allowed' : 'Backlogs allowed'}</p>
                </div>
                
                <div>
                  <Label className="font-medium">No Offer?</Label>
                  <p>{selectedJob.no_offer ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={isEditJobOpen} onOpenChange={setIsEditJobOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Job Title *</Label>
                  <Input
                    id="edit-title"
                    value={editJob.title}
                    onChange={(e) => setEditJob({ ...editJob, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company Name *</Label>
                  <Input
                    id="edit-company"
                    value={editJob.company_name}
                    onChange={(e) => setEditJob({ ...editJob, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Job Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editJob.description}
                  onChange={(e) => setEditJob({ ...editJob, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-package-min">Minimum Package (₹)</Label>
                  <Input
                    id="edit-package-min"
                    type="number"
                    value={editJob.package_min}
                    onChange={(e) => setEditJob({ ...editJob, package_min: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-package-max">Maximum Package (₹)</Label>
                  <Input
                    id="edit-package-max"
                    type="number"
                    value={editJob.package_max}
                    onChange={(e) => setEditJob({ ...editJob, package_max: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ug-percentage">Min UG Percentage *</Label>
                  <Input
                    id="edit-ug-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={editJob.min_ug_percentage}
                    onChange={(e) => setEditJob({ ...editJob, min_ug_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tenth-percentage">Min 10th Percentage</Label>
                  <Input
                    id="edit-tenth-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={editJob.min_tenth_percentage}
                    onChange={(e) => setEditJob({ ...editJob, min_tenth_percentage: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-twelfth-percentage">Min 12th Percentage</Label>
                  <Input
                    id="edit-twelfth-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={editJob.min_twelfth_percentage}
                    onChange={(e) => setEditJob({ ...editJob, min_twelfth_percentage: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-graduation-year">Year of Graduation</Label>
                  <Input
                    id="edit-graduation-year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={editJob.year_of_graduation}
                    onChange={(e) => setEditJob({ ...editJob, year_of_graduation: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-courses">Eligible Courses</Label>
                  <Select
                    value={editJob.courses_allowed.length > 0 ? editJob.courses_allowed[0] : ""}
                    onValueChange={(value) => {
                      const currentCourses = [...editJob.courses_allowed]
                      if (value && !currentCourses.includes(value)) {
                        setEditJob({ ...editJob, courses_allowed: [...currentCourses, value] })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="B.E">B.E</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editJob.courses_allowed.map((course) => (
                      <Badge 
                        key={course} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-red-50"
                        onClick={() => {
                          setEditJob({
                            ...editJob,
                            courses_allowed: editJob.courses_allowed.filter(c => c !== course)
                          })
                        }}
                      >
                        {course} ×
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deadline">Application Deadline</Label>
                  <Input
                    id="edit-deadline"
                    type="datetime-local"
                    value={editJob.application_deadline}
                    onChange={(e) => setEditJob({ ...editJob, application_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tpo-name">TPO Name</Label>
                <Input
                  id="edit-tpo-name"
                  value={editJob.job_title}
                  onChange={(e) => setEditJob({ ...editJob, job_title: e.target.value })}
                  placeholder="TPO name or contact person..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Backlogs Allowed?</Label>
                  <Select
                    value={editJob.no_backlogs_required ? "no" : "yes"}
                    onValueChange={(value) => 
                      setEditJob({ ...editJob, no_backlogs_required: value === "no" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select backlogs criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No Backlogs Required</SelectItem>
                      <SelectItem value="yes">Backlogs Allowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>No Offer ?</Label>
                  <Select
                    value={editJob.no_offer ? "yes" : "no"}
                    onValueChange={(value) => 
                      setEditJob({ ...editJob, no_offer: value === "yes" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select offer criteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job Status</Label>
                <Select value={editJob.status} onValueChange={(value) => setEditJob({ ...editJob, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditJobOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEditJob}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Job Dialog */}
        <Dialog open={isDeleteJobOpen} onOpenChange={setIsDeleteJobOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this job? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-medium">{selectedJob.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedJob.company_name}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDeleteJobOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteJob}>
                    Delete Job
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog open={isViewStudentOpen} onOpenChange={setIsViewStudentOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>View complete student information</DialogDescription>
            </DialogHeader>
            
            {selectedStudent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Name</Label>
                    <p className="text-sm mt-1">{selectedStudent.first_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Registration Number</Label>
                    <p className="text-sm mt-1 font-mono">{selectedStudent.college_reg_no}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p className="text-sm mt-1">{selectedStudent.college_email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Mobile</Label>
                    <p className="text-sm mt-1">{selectedStudent.mobile_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">UG Percentage</Label>
                    <p className="text-sm mt-1">{selectedStudent.ug_percentage}%</p>
                  </div>
                  <div>
                    <Label className="font-medium">Active Backlogs</Label>
                    <p className="text-sm mt-1">{selectedStudent.active_backlogs ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Personal Email</Label>
                    <p className="text-sm mt-1">{selectedStudent.personal_email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">PWD Status</Label>
                    <p className="text-sm mt-1">{selectedStudent.pwd ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Resume Status</Label>
                  <div className="mt-1">
                    {selectedStudent.resume_url ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownloadResume(selectedStudent)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      </div>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Uploaded
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Placement Status</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Offers:</span>
                      <span className="font-mono">{selectedStudent.placement_status.offers?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accepted Offers:</span>
                      <span className="font-mono">{selectedStudent.placement_status.accepted_offers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max CTC:</span>
                      <span className="font-mono">₹{((selectedStudent.placement_status.max_ctc || 0) / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max Offers Allowed:</span>
                      <span className="font-mono">{selectedStudent.placement_status.max_offers_allowed || 2}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsViewStudentOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewStudentOpen(false)
                    handleUpdateStudentStatus(selectedStudent)
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Student Status Dialog */}
        <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Student Status</DialogTitle>
              <DialogDescription>
                Update placement status for {selectedStudent?.first_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={updateStatusForm.status}
                  onValueChange={(value) => {
                    const currentStatus = updateStatusForm.status
                    const newStatus = value
                    
                    // Check if changing from "placed" to "active" 
                    if (currentStatus === "placed" && newStatus === "active") {
                      setPendingStatusChange({ from: currentStatus, to: newStatus })
                      setIsStatusChangeConfirmOpen(true)
                    } else {
                      setUpdateStatusForm({ ...updateStatusForm, status: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="interview">Interview Scheduled</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <Select
                  value={updateStatusForm.company}
                  onValueChange={(value) => setUpdateStatusForm({ ...updateStatusForm, company: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Company</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package">Package Amount (₹)</Label>
                <Input
                  id="package"
                  type="number"
                  value={updateStatusForm.package_amount}
                  onChange={(e) => setUpdateStatusForm({ ...updateStatusForm, package_amount: e.target.value })}
                  placeholder="Package in rupees"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={updateStatusForm.notes}
                  onChange={(e) => setUpdateStatusForm({ ...updateStatusForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUpdateStatusOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveStudentStatusUpdate}>
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Change Confirmation Dialog */}
        <Dialog open={isStatusChangeConfirmOpen} onOpenChange={setIsStatusChangeConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>
                You are changing {selectedStudent?.first_name}'s status from "Placed" to "Active". 
                This will remove all current offers from this student. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => {
                setIsStatusChangeConfirmOpen(false)
                setPendingStatusChange(null)
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                if (pendingStatusChange) {
                  setUpdateStatusForm({ ...updateStatusForm, status: pendingStatusChange.to })
                  setIsStatusChangeConfirmOpen(false)
                  setPendingStatusChange(null)
                }
              }}>
                Yes, Remove Offers
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Company Report Dialog */}
        <Dialog open={isCompanyReportOpen} onOpenChange={setIsCompanyReportOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Company-wise Report</DialogTitle>
              <DialogDescription>
                {selectedCompanyForReport === "all" 
                  ? "All Companies Report" 
                  : `${selectedCompanyForReport} Report`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Total Records: {companyReportData?.length || 0}
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-2 text-left font-medium">Company</th>
                      <th className="p-2 text-left font-medium">Job Title</th>
                      <th className="p-2 text-left font-medium">Student</th>
                      <th className="p-2 text-left font-medium">Reg No</th>
                      <th className="p-2 text-left font-medium">Branch</th>
                      <th className="p-2 text-left font-medium">Course</th>
                      <th className="p-2 text-left font-medium">UG%</th>
                      <th className="p-2 text-left font-medium">10th%</th>
                      <th className="p-2 text-left font-medium">12th%</th>
                      <th className="p-2 text-left font-medium">Grad Year</th>
                      <th className="p-2 text-left font-medium">Status</th>
                      <th className="p-2 text-left font-medium">Package</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(companyReportData || []).map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium text-xs">{item.company_name}</td>
                        <td className="p-2 text-xs">{item.job_title}</td>
                        <td className="p-2 text-xs">{item.student_name}</td>
                        <td className="p-2 font-mono text-xs">{item.student_reg_no}</td>
                        <td className="p-2 text-xs">{item.branch}</td>
                        <td className="p-2 text-xs">{item.course || 'N/A'}</td>
                        <td className="p-2 text-xs">{item.ug_percentage || 'N/A'}</td>
                        <td className="p-2 text-xs">{item.tenth_percentage || 'N/A'}</td>
                        <td className="p-2 text-xs">{item.twelfth_percentage || 'N/A'}</td>
                        <td className="p-2 text-xs">{item.year_of_graduation || 'N/A'}</td>
                        <td className="p-2">
                          <Badge 
                            className={
                              item.status === 'placed' 
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'interview'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {item.package ? `₹${(item.package / 100000).toFixed(1)}L` : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!companyReportData || companyReportData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No data available for the selected company
                </div>
              )}

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadStudentDataWithResumes(selectedCompanyForReport)}
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isDownloadingData}
                  >
                    {isDownloadingData ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Data & Resumes
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportCompanyReport(selectedCompanyForReport)}
                    size="default"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setIsCompanyReportOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
