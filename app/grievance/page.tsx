"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Send } from "lucide-react"

export default function GrievancePage() {
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/grievance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Grievance submitted successfully! We'll get back to you soon.")
        setFormData({
          studentRegNo: "",
          studentName: "",
          issueType: "",
          message: "",
          contactEmail: "",
        })
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit grievance")
      }
    } catch (error) {
      console.error("Error submitting grievance:", error)
      toast.error("Failed to submit grievance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Submit Grievance</h1>
          <p className="text-muted-foreground">
            Have an issue or concern? Let us know and we'll help resolve it.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Grievance Form
            </CardTitle>
            <CardDescription>
              Please provide detailed information about your issue. All submissions are confidential and will be reviewed by our administration team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentRegNo">Registration Number *</Label>
                  <Input
                    id="studentRegNo"
                    placeholder="e.g., 2021CS001"
                    value={formData.studentRegNo}
                    onChange={(e) => handleInputChange("studentRegNo", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full Name *</Label>
                  <Input
                    id="studentName"
                    placeholder="Your full name"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange("studentName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueType">Issue Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("issueType", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Issue Description *</Label>
                <Textarea
                  id="message"
                  placeholder="Please provide detailed information about your issue or concern..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  required
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Please be as specific as possible to help us understand and resolve your issue quickly.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
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
  )
}