"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabaseClient, type StudentDetails, uploadResume, downloadResume } from "@/lib/supabase"
import { Upload, FileText, CheckCircle, AlertCircle, User, Save, Download } from "lucide-react"

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

export default function ProfilePage() {
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchStudentData()
  }, [])

  useEffect(() => {
    if (student) {
      calculateProfileCompletion()
    }
  }, [student])

  const fetchStudentData = async () => {
    try {
      // Try localStorage first (demo mode)
      const storedProfile = localStorage.getItem("student_profile")
      if (storedProfile) {
        setStudent(JSON.parse(storedProfile))
        return
      }

      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }

      const { data, error } = await supabaseClient.from("student_details").select("*").eq("user_id", user.id).single()

      if (error && error.code === "PGRST116") {
        // No profile found, redirect to registration
        router.push("/register")
        return
      }

      if (error) throw error
      setStudent(data)
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("Failed to load profile data")
    }
  }

  const calculateProfileCompletion = () => {
    if (!student) return

    let completed = 0
    const totalFields = 12

    // Basic fields
    if (student.first_name) completed++
    if (student.gender) completed++
    if (student.college_reg_no) completed++
    if (student.date_of_birth) completed++
    if (student.college_email) completed++
    if (student.personal_email) completed++
    if (student.mobile_number) completed++
    if (student.branch) completed++
    if (student.ug_percentage) completed++
    if (student.resume_url) completed++

    // Additional completeness checks
    if (student.ug_percentage >= 60) completed++ // Good percentage
    if (!student.active_backlogs) completed++ // No backlogs

    const percentage = Math.round((completed / totalFields) * 100)
    setProfileCompletion(percentage)
  }

  const handleInputChange = (field: keyof StudentDetails, value: any) => {
    if (student) {
      setStudent({ ...student, [field]: value })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed")
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("File size must be less than 2MB")
        return
      }
      setResumeFile(file)
      setError("")
    }
  }

  const handleSave = async () => {
    if (!student) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Handle resume upload if new file selected
      let resumeUrl = student.resume_url
      if (resumeFile) {
        try {
          const { publicUrl } = await uploadResume(resumeFile, student.branch, student.college_reg_no, student.branch)
          resumeUrl = publicUrl
        } catch (uploadError) {
          console.warn("Resume upload failed:", uploadError)
          setError("Failed to upload resume. Please try again.")
          return
        }
      }

      // Update student details
      const updatedData = { ...student, resume_url: resumeUrl, updated_at: new Date().toISOString() }

      // For demo mode, update localStorage
      localStorage.setItem("student_profile", JSON.stringify(updatedData))

      const { error: updateError } = await supabaseClient
        .from("student_details")
        .update(updatedData)
        .eq("id", student.id)

      if (updateError) throw updateError

      setStudent(updatedData)
      setIsEditing(false)
      setResumeFile(null)
      setSuccess("Profile updated successfully!")
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadResume = async () => {
    if (!student?.resume_url) return

    try {
      const fileName = `${student.college_reg_no}_Resume.pdf`
      await downloadResume(student.resume_url, fileName)
      setSuccess("Resume downloaded successfully!")
    } catch (error) {
      console.error("Download error:", error)
      setError("Failed to download resume. Please try again.")
    }
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 90) return "Excellent"
    if (percentage >= 70) return "Good"
    return "Needs Improvement"
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Student Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your personal information and documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Completion Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Strength
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getCompletionColor(profileCompletion)}`}>
                    {profileCompletion}%
                  </div>
                  <p className="text-sm text-gray-500">{getCompletionStatus(profileCompletion)}</p>
                </div>
                <Progress value={profileCompletion} className="h-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Basic Information</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Academic Details</span>
                  </div>
                  {student.resume_url ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resume Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Resume Missing</span>
                    </div>
                  )}
                </div>
                {profileCompletion < 100 && (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      Complete your profile to apply for jobs
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <User className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </Button>
                {student.resume_url && (
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/jobs")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your academic and personal details</CardDescription>
                  </div>
                  <Badge variant={profileCompletion >= 90 ? "default" : "secondary"}>{student.college_reg_no}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={student.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      disabled={!isEditing}
                      className="transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={student.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regNo">Registration Number</Label>
                    <Input
                      id="regNo"
                      value={student.college_reg_no}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={student.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collegeEmail">College Email</Label>
                    <Input
                      id="collegeEmail"
                      type="email"
                      value={student.college_email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      value={student.personal_email}
                      onChange={(e) => handleInputChange("personal_email", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={student.mobile_number}
                      onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select
                      value={student.branch}
                      onValueChange={(value) => handleInputChange("branch", value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="percentage">UG Percentage</Label>
                    <Input
                      id="percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={student.ug_percentage}
                      onChange={(e) => handleInputChange("ug_percentage", Number.parseFloat(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Active Backlogs</Label>
                    <RadioGroup
                      value={student.active_backlogs ? "yes" : "no"}
                      onValueChange={(value) => handleInputChange("active_backlogs", value === "yes")}
                      disabled={!isEditing}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="backlogs-yes" />
                        <Label htmlFor="backlogs-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="backlogs-no" />
                        <Label htmlFor="backlogs-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Person with Disability (PWD)</Label>
                    <RadioGroup
                      value={student.pwd ? "yes" : "no"}
                      onValueChange={(value) => handleInputChange("pwd", value === "yes")}
                      disabled={!isEditing}
                      className="flex space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="pwd-yes" />
                        <Label htmlFor="pwd-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="pwd-no" />
                        <Label htmlFor="pwd-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Resume Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Resume</Label>
                    {student.resume_url && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>

                  {isEditing && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {resumeFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                          <p className="text-sm font-medium text-green-600">{resumeFile.name}</p>
                          <p className="text-xs text-gray-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <FileText className="w-4 h-4 mr-2" />
                              {student.resume_url ? "Replace Resume" : "Upload Resume"}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">PDF only, max 2MB</p>
                        </div>
                      )}
                    </div>
                  )}

                  {student.resume_url && !isEditing && (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Resume Uploaded</p>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            {student.college_reg_no}_Resume.pdf
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                  </Alert>
                )}

                {isEditing && (
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setResumeFile(null)
                        setError("")
                        fetchStudentData()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
