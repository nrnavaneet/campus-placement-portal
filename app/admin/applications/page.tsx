"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Calendar,
  Edit,
  Eye,
  Search,
  ArrowLeft
} from "lucide-react"
import type { Job } from "@/lib/supabase"

interface Application {
  id: string
  student_reg_no: string
  student_name?: string
  job_id: string
  job_title: string
  company_name: string
  status: string
  applied_at: string
  updated_at: string
  rounds?: ApplicationRound[]
}

interface ApplicationRound {
  id: string
  round_number: number
  round_name: string
  round_type: string
  status: string
  scheduled_at?: string
  completed_at?: string
  feedback?: string
  score?: number
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<string>("")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false)
  const [isAppModalOpen, setIsAppModalOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState<ApplicationRound | null>(null)
  const [updateData, setUpdateData] = useState({
    status: "",
    notes: "",
    feedback: "",
    score: "",
    scheduled_at: ""
  })
  const [appUpdateData, setAppUpdateData] = useState({
    current_stage: "",
    notes: "",
    package_amount: ""
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob)
    }
  }, [selectedJob])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs')
      if (response.ok) {
        const result = await response.json()
        setJobs(result.data || []) // API returns { data: [...] }
        if (result.data?.length > 0) {
          setSelectedJob(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchApplications = async (jobId: string) => {
    setIsLoading(true)
    try {
      // Fetch applications for the job
      const appResponse = await fetch(`/api/admin/applications?job_id=${jobId}`)
      if (!appResponse.ok) throw new Error('Failed to fetch applications')
      
      const appData = await appResponse.json()
      const apps = appData.applications || []

      // Fetch round data for each application
      const appsWithRounds = await Promise.all(
        apps.map(async (app: Application) => {
          try {
            const roundsResponse = await fetch(`/api/admin/application-rounds?application_id=${app.id}`)
            if (roundsResponse.ok) {
              const roundsData = await roundsResponse.json()
              app.rounds = roundsData.rounds || []
            }
          } catch (error) {
            console.error(`Error fetching rounds for application ${app.id}:`, error)
            app.rounds = []
          }
          return app
        })
      )

      setApplications(appsWithRounds)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRound = async () => {
    if (!selectedRound || !selectedApplication) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/application-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          job_round_id: selectedRound.id,
          status: updateData.status,
          notes: updateData.notes,
          feedback: updateData.feedback,
          score: updateData.score ? parseFloat(updateData.score) : null,
          scheduled_at: updateData.scheduled_at || null
        })
      })

      if (response.ok) {
        // Refresh applications
        await fetchApplications(selectedJob)
        setIsRoundModalOpen(false)
        setSelectedRound(null)
        setUpdateData({ status: "", notes: "", feedback: "", score: "", scheduled_at: "" })
      } else {
        console.error('Failed to update round')
      }
    } catch (error) {
      console.error('Error updating round:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openRoundModal = (application: Application, round: ApplicationRound) => {
    setSelectedApplication(application)
    setSelectedRound(round)
    setUpdateData({
      status: round.status,
      notes: "",
      feedback: round.feedback || "",
      score: round.score?.toString() || "",
      scheduled_at: round.scheduled_at || ""
    })
    setIsRoundModalOpen(true)
  }

  const handleUpdateApplication = async () => {
    if (!selectedApplication || !appUpdateData.current_stage) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApplication.id,
          current_stage: appUpdateData.current_stage,
          notes: appUpdateData.notes,
          package_amount: appUpdateData.current_stage === 'placed' ? parseFloat(appUpdateData.package_amount) || null : null
        })
      })

      if (response.ok) {
        // Refresh applications
        await fetchApplications(selectedJob)
        setIsAppModalOpen(false)
        setSelectedApplication(null)
        setAppUpdateData({ current_stage: "", notes: "", package_amount: "" })
      } else {
        console.error('Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openAppModal = (application: Application) => {
    setSelectedApplication(application)
    setAppUpdateData({
      current_stage: application.status,
      notes: "",
      package_amount: ""
    })
    setIsAppModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'under_review': 'bg-blue-100 text-blue-800',
      'shortlisted': 'bg-yellow-100 text-yellow-800',
      'placed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'shortlisted': return <Calendar className="w-4 h-4" />
      case 'under_review': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.student_reg_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.student_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/admin" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Admin Dashboard
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Application Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage student applications and recruitment rounds
          </p>
        </div>

        {/* Job Selection and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="job-select">Select Job</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} - {job.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by reg no or name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-filter">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => selectedJob && fetchApplications(selectedJob)}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading applications...</p>
            </CardContent>
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {application.student_reg_no}
                        {application.student_name && ` - ${application.student_name}`}
                      </CardTitle>
                      <CardDescription>
                        Applied on {new Date(application.applied_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAppModal(application)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3">Recruitment Rounds</h4>
                    {application.rounds && application.rounds.length > 0 ? (
                      <div className="space-y-3">
                        {application.rounds
                          .sort((a, b) => a.round_number - b.round_number)
                          .map((round) => (
                            <div key={round.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(round.status)}
                                <div>
                                  <p className="font-medium">
                                    Round {round.round_number}: {round.round_name}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {round.round_type} • Status: {round.status}
                                  </p>
                                  {round.scheduled_at && (
                                    <p className="text-sm text-blue-600">
                                      Scheduled: {new Date(round.scheduled_at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRoundModal(application, round)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Update
                              </Button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No recruitment rounds configured for this job.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Round Update Modal */}
        <Dialog open={isRoundModalOpen} onOpenChange={setIsRoundModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Update Round: {selectedRound?.round_name}
              </DialogTitle>
              <DialogDescription>
                Update the status and details for {selectedApplication?.student_reg_no}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={updateData.status} onValueChange={(value) => setUpdateData({...updateData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(updateData.status === 'scheduled') && (
                <div>
                  <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={updateData.scheduled_at}
                    onChange={(e) => setUpdateData({...updateData, scheduled_at: e.target.value})}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="score">Score (Optional)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter score out of 100"
                  value={updateData.score}
                  onChange={(e) => setUpdateData({...updateData, score: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this round..."
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Feedback for the student..."
                  value={updateData.feedback}
                  onChange={(e) => setUpdateData({...updateData, feedback: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsRoundModalOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateRound} disabled={isUpdating} className="flex-1">
                  {isUpdating ? 'Updating...' : 'Update Round'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Application Status Update Modal */}
        <Dialog open={isAppModalOpen} onOpenChange={setIsAppModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Update Application Status
              </DialogTitle>
              <DialogDescription>
                Update the overall application status for {selectedApplication?.student_reg_no}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="app-status">Application Status</Label>
                <Select 
                  value={appUpdateData.current_stage} 
                  onValueChange={(value) => {
                    const updatedData = { ...appUpdateData, current_stage: value }
                    
                    // Auto-fill package amount when "placed" is selected
                    if (value === 'placed' && selectedApplication) {
                      const job = jobs.find(j => j.id === selectedApplication.job_id)
                      if (job && job.package_min) {
                        updatedData.package_amount = (job.package_min / 100000).toString() // Convert to lakhs
                      }
                    }
                    
                    setAppUpdateData(updatedData)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {appUpdateData.current_stage === 'placed' && (
                <div>
                  <Label htmlFor="package-amount">Package Amount (per annum)</Label>
                  <Input
                    id="package-amount"
                    type="number"
                    placeholder="Enter package amount in lakhs (e.g., 12)"
                    value={appUpdateData.package_amount}
                    onChange={(e) => setAppUpdateData({...appUpdateData, package_amount: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter amount in lakhs per annum (e.g., 12 for 12 LPA)</p>
                </div>
              )}

              <div>
                <Label htmlFor="app-notes">Status Change Notes</Label>
                <Textarea
                  id="app-notes"
                  placeholder="Add notes about this status change..."
                  value={appUpdateData.notes}
                  onChange={(e) => setAppUpdateData({...appUpdateData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsAppModalOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateApplication} disabled={isUpdating || !appUpdateData.current_stage} className="flex-1">
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}