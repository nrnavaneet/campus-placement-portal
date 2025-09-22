"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Send, Plus, ArrowLeft, Clock, MessageSquare } from "lucide-react"
import { StudentDetails } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface Grievance {
  id: string
  student_reg_no: string
  student_name: string
  issue_type: string
  message: string
  contact_email: string
  status: string
  created_at: string
  resolved_at?: string
  admin_response?: string
}

export default function GrievancePage() {
  const { student } = useAuth()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loadingGrievances, setLoadingGrievances] = useState(true)
  const [formData, setFormData] = useState({
    studentRegNo: "",
    studentName: "",
    issueType: "",
    message: "",
    contactEmail: "",
  })

  const issueTypes = [
    "Academic Issues",
    "Placement Process",
    "Infrastructure", 
    "Faculty Related",
    "Administrative Issues",
    "Technical Issues",
    "Other"
  ]

  const statusColors = {
    'submitted': 'bg-blue-500',
    'in_progress': 'bg-yellow-500',
    'resolved': 'bg-green-500',
    'closed': 'bg-gray-500'
  }

  const statusLabels = {
    'submitted': 'Submitted',
    'in_progress': 'In Progress',
    'resolved': 'Resolved', 
    'closed': 'Closed'
  }

  useEffect(() => {
    fetchStudentData()
    fetchGrievances()
  }, [])

  const fetchStudentData = async () => {
    if (!student) {
      toast.error("Please log in to submit grievances")
      router.push("/")
      return
    }

    try {
      setFormData(prev => ({
        ...prev,
        studentRegNo: student.college_reg_no || "",
        studentName: student.first_name || "",
        contactEmail: student.college_email || student.personal_email || "",
      }))
    } catch (error) {
      console.error("Error loading student data:", error)
      toast.error("Failed to load student profile")
    }
  }

  const fetchGrievances = async () => {
    if (!student) {
      toast.error("Please log in to view grievances")
      router.push("/")
      return
    }

    try {
      setLoadingGrievances(true)
      const regNo = student.college_reg_no

      if (regNo) {
        const response = await fetch(`/api/grievance?student_reg_no=${encodeURIComponent(regNo)}`)
        if (response.ok) {
          const data = await response.json()
          setGrievances(data)
        } else {
          console.error("Failed to fetch grievances")
          toast.error("Failed to load grievances")
        }
      }
    } catch (error) {
      console.error("Error fetching grievances:", error)
      toast.error("Failed to load grievances")
    } finally {
      setLoadingGrievances(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔄 Starting grievance submission...')
    console.log('📝 Form data:', formData)
    setIsLoading(true)

    try {
      console.log('📡 Sending API request...')
      const response = await fetch("/api/grievance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log('📨 API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Success response:', result)
        toast.success("Grievance submitted successfully! We'll get back to you soon.", {
          duration: 4000, // Auto-fade after 4 seconds (longer message)
        })
        setFormData(prev => ({
          ...prev,
          issueType: "",
          message: "",
        }))
        setShowForm(false)
        fetchGrievances() // Refresh the list
      } else {
        const error = await response.json()
        console.error('❌ Error response:', error)
        toast.error(error.error || "Failed to submit grievance")
      }
    } catch (error) {
      console.error("❌ Fetch error:", error)
      toast.error("Failed to submit grievance")
    } finally {
      setIsLoading(false)
      console.log('🏁 Grievance submission completed')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowForm(false)}
                className="mb-4 hover:bg-white/20 dark:hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Grievances
              </Button>
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center sm:text-left">
                  Submit New Grievance
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-center sm:text-left text-sm sm:text-base">
                  Have an issue or concern? Let us know and we'll help resolve it.
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <AlertCircle className="w-5 h-5" />
                  Grievance Form
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Please provide detailed information about your issue. All submissions are confidential and will be reviewed by our administration team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentRegNo" className="text-slate-700 dark:text-slate-200">Registration Number *</Label>
                      <Input
                        id="studentRegNo"
                        placeholder="e.g., 2021CS001"
                        value={formData.studentRegNo}
                        onChange={(e) => handleInputChange("studentRegNo", e.target.value)}
                        required
                        disabled
                        className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studentName" className="text-slate-700 dark:text-slate-200">Full Name *</Label>
                      <Input
                        id="studentName"
                        placeholder="Your full name"
                        value={formData.studentName}
                        onChange={(e) => handleInputChange("studentName", e.target.value)}
                        required
                        disabled
                        className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issueType" className="text-slate-700 dark:text-slate-200">Issue Type *</Label>
                      <Select onValueChange={(value) => handleInputChange("issueType", value)} required>
                        <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                          {issueTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-slate-700 dark:text-slate-200">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        required
                        disabled
                        className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-700 dark:text-slate-200">Issue Description *</Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide detailed information about your issue or concern..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      required
                      rows={6}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-400"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Please be as specific as possible to help us understand and resolve your issue quickly.
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">What happens next?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Your grievance will be reviewed within 24 hours</li>
                          <li>• You'll receive email updates on the status</li>
                          <li>• You can track progress in your dashboard</li>
                          <li>• Our team will work to resolve issues promptly</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Grievance
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center sm:text-left">
                My Grievances
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-center sm:text-left text-sm sm:text-base">
                Track your submitted grievances and their resolution status
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Submit New Grievance</span>
                <span className="sm:hidden">New Grievance</span>
              </Button>
            </div>
          </div>

          {loadingGrievances ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg bg-white/80 dark:bg-slate-800/80">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : grievances.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">No grievances submitted</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-4">
                  You haven't submitted any grievances yet. If you have any issues or concerns, feel free to submit a new grievance.
                </p>
                <Button 
                  onClick={() => setShowForm(true)} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your First Grievance
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {grievances.map((grievance) => (
                <Card key={grievance.id} className="hover:shadow-xl transition-all duration-200 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-200 truncate">{grievance.issue_type}</h3>
                          <Badge 
                            className={`${statusColors[grievance.status as keyof typeof statusColors]} text-white border-0 text-xs sm:text-sm self-start sm:self-center`}
                          >
                            {statusLabels[grievance.status as keyof typeof statusLabels] || grievance.status}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          Submitted on {formatDate(grievance.created_at)}
                        </p>
                        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-3 line-clamp-2 sm:line-clamp-3">
                          {grievance.message}
                        </p>
                        {grievance.admin_response && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3 mt-3">
                            <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                              Admin Response:
                            </p>
                            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                              {grievance.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}