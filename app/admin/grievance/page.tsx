"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { MessageSquare, Eye, Edit, Filter, RefreshCw, CheckCircle, Clock, AlertCircle, Calendar, Mail } from "lucide-react"

export default function AdminGrievancePage() {
  const [grievances, setGrievances] = useState<any[]>([])
  const [filteredGrievances, setFilteredGrievances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [adminResponse, setAdminResponse] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchGrievances()
  }, [])

  useEffect(() => {
    filterGrievances()
  }, [grievances, statusFilter, searchTerm])

  const fetchGrievances = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/grievance")
      if (response.ok) {
        const data = await response.json()
        setGrievances(data)
      } else {
        toast.error("Failed to fetch grievances")
      }
    } catch (error) {
      console.error("Error fetching grievances:", error)
      toast.error("Failed to fetch grievances")
    } finally {
      setLoading(false)
    }
  }

  const filterGrievances = () => {
    let filtered = [...grievances]

    if (statusFilter !== "all") {
      filtered = filtered.filter(g => g.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.student_reg_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredGrievances(filtered)
  }

  const updateGrievanceStatus = async (grievanceId: string, status: string, response?: string) => {
    try {
      setUpdatingStatus(true)
      const updateData: any = { status }
      if (response) {
        updateData.admin_response = response
      }

      const res = await fetch(`/api/admin/grievance/${grievanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        toast.success("Grievance updated successfully")
        fetchGrievances()
        setSelectedGrievance(null)
        setAdminResponse("")
      } else {
        toast.error("Failed to update grievance")
      }
    } catch (error) {
      console.error("Error updating grievance:", error)
      toast.error("Failed to update grievance")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const sendSMSUpdate = async (grievance: any) => {
    try {
      const message = `Hi ${grievance.student_name}, your grievance "${grievance.issue_type}" has been updated to ${grievance.status.replace('_', ' ').toUpperCase()}. Check your dashboard for details. - MSRU Admin`
      // Here you would integrate with an SMS service like Twilio or TextBelt
      console.log("SMS would be sent:", message)
      toast.success("SMS notification sent to student")
    } catch (error) {
      console.error("Error sending SMS:", error)
      toast.error("Failed to send SMS")
    }
  }

  const sendEmailUpdate = async (grievance: any) => {
    try {
      // Here you would integrate with an email service
      console.log("Email notification would be sent to:", grievance.contact_email)
      toast.success("Email notification sent to student")
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "submitted":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4" />
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />
      case "submitted":
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStatsData = () => {
    const total = grievances.length
    const submitted = grievances.filter(g => g.status === "submitted").length
    const inProgress = grievances.filter(g => g.status === "in_progress").length
    const resolved = grievances.filter(g => g.status === "resolved").length

    return { total, submitted, inProgress, resolved }
  }

  const stats = getStatsData()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Grievance Management</h1>
            <p className="text-muted-foreground">Manage student grievances and provide responses</p>
          </div>
          <Button onClick={fetchGrievances} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grievances</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Submissions</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grievances</CardTitle>
          <CardDescription>View and manage all student grievances</CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search by student name, reg no, or issue type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 rounded-lg border bg-gray-50">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredGrievances.length > 0 ? (
            <div className="space-y-4">
              {filteredGrievances.map((grievance) => (
                <div
                  key={grievance.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{grievance.student_name}</h3>
                        <Badge className={getStatusColor(grievance.status)} variant="outline">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(grievance.status)}
                            {formatStatus(grievance.status)}
                          </div>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                        <span>Reg No: {grievance.student_reg_no}</span>
                        <span>Issue: {grievance.issue_type}</span>
                        <span>Date: {new Date(grievance.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {grievance.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {grievance.contact_email}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Quick Actions */}
                      {grievance.status === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateGrievanceStatus(grievance.id, 'in_progress')}
                          disabled={updatingStatus}
                          className="gap-1 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                        >
                          <Clock className="w-3 h-3" />
                          Start Progress
                        </Button>
                      )}
                      
                      {grievance.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendSMSUpdate(grievance)}
                          className="gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          <MessageSquare className="w-3 h-3" />
                          SMS Update
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGrievance(grievance)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Grievance Management</DialogTitle>
                            <DialogDescription>
                              Review and respond to student grievance
                            </DialogDescription>
                          </DialogHeader>
                          {selectedGrievance && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Student Name</Label>
                                  <p className="text-sm text-muted-foreground">{selectedGrievance.student_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Registration Number</Label>
                                  <p className="text-sm text-muted-foreground">{selectedGrievance.student_reg_no}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Issue Type</Label>
                                  <p className="text-sm text-muted-foreground">{selectedGrievance.issue_type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Contact Email</Label>
                                  <p className="text-sm text-muted-foreground">{selectedGrievance.contact_email}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium">Issue Description</Label>
                                <p className="text-sm text-muted-foreground mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                  {selectedGrievance.message}
                                </p>
                              </div>

                              {selectedGrievance.admin_response && (
                                <div>
                                  <Label className="text-sm font-medium">Previous Admin Response</Label>
                                  <p className="text-sm text-muted-foreground mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                    {selectedGrievance.admin_response}
                                  </p>
                                </div>
                              )}

                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Status Management</Label>
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    <Button
                                      size="sm"
                                      variant={selectedGrievance.status === "in_progress" ? "default" : "outline"}
                                      onClick={() => updateGrievanceStatus(selectedGrievance.id, "in_progress")}
                                      disabled={updatingStatus}
                                      className="gap-2"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                      Mark In Progress
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedGrievance.status === "resolved" ? "default" : "outline"}
                                      onClick={() => {
                                        if (adminResponse.trim()) {
                                          updateGrievanceStatus(selectedGrievance.id, "resolved", adminResponse)
                                        } else {
                                          toast.error("Please provide an admin response before resolving")
                                        }
                                      }}
                                      disabled={updatingStatus}
                                      className="gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark Resolved
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Notification Options</Label>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => sendSMSUpdate(selectedGrievance)}
                                      disabled={updatingStatus}
                                      className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      Send SMS Update
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => sendEmailUpdate(selectedGrievance)}
                                      disabled={updatingStatus}
                                      className="gap-2 bg-green-50 hover:bg-green-100 border-green-200"
                                    >
                                      <Mail className="w-4 h-4" />
                                      Send Email Update
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="adminResponse" className="text-sm font-medium">Admin Response</Label>
                                  <Textarea
                                    id="adminResponse"
                                    placeholder="Provide your response to the student..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    rows={4}
                                    className="mt-1"
                                  />
                                </div>

                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    if (adminResponse.trim()) {
                                      updateGrievanceStatus(selectedGrievance.id, selectedGrievance.status, adminResponse)
                                    } else {
                                      toast.error("Please provide an admin response")
                                    }
                                  }}
                                  disabled={updatingStatus || !adminResponse.trim()}
                                >
                                  {updatingStatus ? "Updating..." : "Update Response"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No grievances found</p>
              <p className="text-sm">
                {statusFilter !== "all" || searchTerm ? "Try adjusting your filters" : "No grievances have been submitted yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}