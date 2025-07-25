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
import {
  Users,
  Briefcase,
  TrendingUp,
  Plus,
  Settings,
  LogOut,
  Moon,
  Sun,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Edit,
  Trash2,
  Eye,
  Search,
  GraduationCap,
  Calendar,
  DollarSign,
  MessageSquare,
  BarChart3,
} from "lucide-react"

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<StudentDetails[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [grievances, setGrievances] = useState<GrievanceReport[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterJobStatus, setFilterJobStatus] = useState("all")
  const [selectedJobForExport, setSelectedJobForExport] = useState("all")
  const [isAddJobOpen, setIsAddJobOpen] = useState(false)
  const [isGrievanceDialogOpen, setIsGrievanceDialogOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceReport | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingGrievances: 0,
    placedStudents: 0,
    averagePackage: 0,
  })
  const [newJob, setNewJob] = useState({
    title: "",
    company_name: "",
    description: "",
    package_min: "",
    package_max: "",
    min_ug_percentage: "",
    branches_allowed: [] as string[],
    no_backlogs_required: true,
    application_deadline: "",
    status: "upcoming" as const,
  })
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const branches = [
    "Computer Science",
    "Information Technology",
    "Electronics and Communication",
    "Electrical and Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Aerospace Engineering",
    "Biotechnology",
    "Chemical Engineering",
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
      // Fetch students
      const allStudents = JSON.parse(localStorage.getItem("all_students") || "[]")
      setStudents(allStudents)

      // Fetch jobs from both Supabase and localStorage
      let allJobs = []
      try {
        const { data: jobsData } = await supabaseClient.from("jobs").select("*")
        if (jobsData) {
          allJobs = [...jobsData]
        }
      } catch (error) {
        console.log("Using localStorage for jobs")
      }

      // Add jobs from localStorage (admin created)
      const localJobs = JSON.parse(localStorage.getItem("all_jobs") || "[]")
      allJobs = [...allJobs, ...localJobs]

      // Remove duplicates based on ID
      const uniqueJobs = allJobs.filter((job, index, self) => index === self.findIndex((j) => j.id === job.id))

      setJobs(uniqueJobs)

      // Fetch grievances
      const allGrievances = JSON.parse(localStorage.getItem("all_grievances") || "[]")
      setGrievances(allGrievances)

      // Fetch recent activities
      const activities = JSON.parse(localStorage.getItem("recent_activities") || "[]")
      setRecentActivities(activities)

      // Calculate stats
      const placedCount = allStudents.filter((s: StudentDetails) => s.placement_status.accepted_offers > 0).length
      const totalPackages = allStudents
        .filter((s: StudentDetails) => s.placement_status.max_ctc > 0)
        .reduce((sum: number, s: StudentDetails) => sum + s.placement_status.max_ctc, 0)
      const avgPackage = placedCount > 0 ? totalPackages / placedCount / 100000 : 0
      const pendingGrievances = allGrievances.filter((g: GrievanceReport) => g.status === "submitted").length

      setStats({
        totalStudents: allStudents.length,
        activeJobs: uniqueJobs.filter((j: Job) => j.status === "active").length,
        totalApplications: JSON.parse(localStorage.getItem("all_applications") || "[]").length,
        pendingGrievances,
        placedStudents: placedCount,
        averagePackage: Math.round(avgPackage * 10) / 10,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem("admin_session")
    router.push("/")
  }

  const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const handleAddJob = async () => {
    if (!newJob.title || !newJob.company_name || !newJob.description) {
      setError("Please fill in all required fields")
      return
    }

    if (newJob.branches_allowed.length === 0) {
      setError("Please select at least one eligible branch")
      return
    }

    const jobData = {
      id: generateUUID(),
      title: newJob.title,
      company_name: newJob.company_name,
      company_logo: `/placeholder.svg?height=60&width=60&text=${newJob.company_name.substring(0, 2).toUpperCase()}`,
      description: newJob.description,
      package_min: Number.parseInt(newJob.package_min) || 0,
      package_max: Number.parseInt(newJob.package_max) || 0,
      min_ug_percentage: Number.parseFloat(newJob.min_ug_percentage) || 0,
      branches_allowed: newJob.branches_allowed,
      no_backlogs_required: newJob.no_backlogs_required,
      counts_as_offer: true,
      eligibility_criteria: {
        experience: "0-2 years",
        skills: [],
      },
      timeline: [
        { stage: "Application", date: newJob.application_deadline, description: "Submit application with resume" },
        { stage: "Review", date: "", description: "Application review process" },
        { stage: "Interview", date: "", description: "Interview rounds" },
        { stage: "Result", date: "", description: "Final selection results" },
      ],
      status: newJob.status,
      application_deadline: newJob.application_deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const { error: insertError } = await supabaseClient.from("jobs").insert(jobData)

      if (insertError) {
        console.error("Insert error:", insertError)
      }

      // Update local state immediately
      setJobs((prevJobs) => [...prevJobs, jobData])
      setIsAddJobOpen(false)

      // Reset form
      setNewJob({
        title: "",
        company_name: "",
        description: "",
        package_min: "",
        package_max: "",
        min_ug_percentage: "",
        branches_allowed: [],
        no_backlogs_required: true,
        application_deadline: "",
        status: "upcoming",
      })

      setSuccess("Job posted successfully!")
      fetchData() // Refresh data
    } catch (error: any) {
      console.error("Error adding job:", error)
      setError(error.message || "Failed to create job")
    }
  }

  const handleGrievanceResponse = async () => {
    if (!selectedGrievance || !adminResponse.trim()) {
      alert("Please provide a response")
      return
    }

    try {
      const updatedGrievance = {
        ...selectedGrievance,
        status: "resolved" as const,
        admin_response: adminResponse,
        updated_at: new Date().toISOString(),
      }

      await supabaseClient.from("grievance_reports").update(updatedGrievance).eq("id", selectedGrievance.id)

      setGrievances(grievances.map((g) => (g.id === selectedGrievance.id ? updatedGrievance : g)))
      setIsGrievanceDialogOpen(false)
      setSelectedGrievance(null)
      setAdminResponse("")
      fetchData()
    } catch (error) {
      console.error("Error updating grievance:", error)
    }
  }

  const exportStudentData = () => {
    const csvContent = [
      ["Name", "Registration No", "Email", "Branch", "Percentage", "Mobile", "Resume Status"].join(","),
      ...students.map((student) =>
        [
          student.first_name,
          student.college_reg_no,
          student.college_email,
          student.branch,
          student.ug_percentage,
          student.mobile_number,
          student.resume_url ? "Uploaded" : "Not Uploaded",
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
  }

  const exportJobData = () => {
    let jobsToExport = jobs
    if (selectedJobForExport !== "all") {
      jobsToExport = jobs.filter((job) => job.id === selectedJobForExport)
    }

    const csvContent = [
      [
        "Job Title",
        "Company",
        "Package Min",
        "Package Max",
        "Min Percentage",
        "Status",
        "Deadline",
        "Eligible Branches",
      ].join(","),
      ...jobsToExport.map((job) =>
        [
          job.title,
          job.company_name,
          job.package_min,
          job.package_max,
          job.min_ug_percentage,
          job.status,
          job.application_deadline,
          job.branches_allowed.join("; "),
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
        package: `₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L`,
        status: job.status,
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
Average Package: ₹${reportData.averagePackage}L

BRANCH-WISE PLACEMENT DATA
==========================
${reportData.branchWiseData
  .map((branch) => `${branch.branch}: ${branch.placed}/${branch.total} (${branch.rate}%)`)
  .join("\n")}

COMPANY-WISE DATA
=================
${reportData.companyWiseData
  .map((company) => `${company.company} - ${company.position} (${company.package}) - ${company.status}`)
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
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college_reg_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.college_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBranch = filterBranch === "all" || student.branch === filterBranch
    return matchesSearch && matchesBranch
  })

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterJobStatus === "all" || job.status === filterJobStatus
    return matchesStatus
  })

  const filteredGrievances = grievances.filter((grievance) => {
    const matchesSearch =
      grievance.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.student_reg_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.issue_type.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
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

              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage placement activities and student applications</p>
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
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Currently open positions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">All time applications</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placed Students</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.placedStudents}</div>
              <p className="text-xs text-muted-foreground">Successfully placed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Package</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">₹{stats.averagePackage}L</div>
              <p className="text-xs text-muted-foreground">Per annum</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system activities and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddJobOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddJob}>Add Job</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={exportStudentData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Student Data
                  </Button>

                  <div className="space-y-2">
                    <Select value={selectedJobForExport} onValueChange={setSelectedJobForExport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job for export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.company_name} - {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="w-full justify-start bg-transparent" onClick={exportJobData}>
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
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Job
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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
                              : job.status === "ongoing"
                                ? "bg-yellow-100 text-yellow-800"
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
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>
                          ₹{(job.package_min / 100000).toFixed(1)}L - ₹{(job.package_max / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>{job.min_ug_percentage}% minimum</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span>{new Date(job.application_deadline).toLocaleDateString()}</span>
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

                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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
            </div>

            {/* Students Table */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {student.resume_url && (
                                <Button variant="outline" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
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

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grievances List */}
            <div className="space-y-4">
              {filteredGrievances.map((grievance) => (
                <Card
                  key={grievance.id}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"
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
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Branch-wise Distribution</CardTitle>
                  <CardDescription>Student distribution across branches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {branches.slice(0, 5).map((branch) => {
                      const count = students.filter((s) => s.branch === branch).length
                      const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0
                      return (
                        <div key={branch} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{branch}</span>
                            <span>{count} students</span>
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

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
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
      </div>
    </div>
  )
}
