"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { supabaseClient, generateUUID, uploadResume } from "@/lib/supabase"
import { Upload, FileText, CheckCircle, AlertCircle, X, Trash2 } from "lucide-react"

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

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    gender: "",
    collegeRegNo: "",
    pwd: "",
    dateOfBirth: "",
    collegeEmail: "",
    personalEmail: "",
    mobileNumber: "",
    branch: "",
    ugPercentage: "",
    activeBacklogs: "",
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeError, setResumeError] = useState("")
  const [skipResume, setSkipResume] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const validateRegNo = (regNo: string) => {
    const regex = /^22[A-Z]{2,4}[0-9]{6}$/i
    return regex.test(regNo)
  }

  const generateCollegeEmail = (regNo: string) => {
    if (validateRegNo(regNo)) {
      return `${regNo.toLowerCase()}@msruas.ac.in`
    }
    return ""
  }

  const validateResume = (file: File) => {
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed"
    }
    if (file.size > 2 * 1024 * 1024) {
      return "File size must be less than 2MB"
    }

    // Check if filename contains registration number (case insensitive)
    const regNo = formData.collegeRegNo.toLowerCase()
    const fileName = file.name.toLowerCase()
    if (regNo && !fileName.includes(regNo)) {
      return `Resume filename should contain your registration number (${formData.collegeRegNo}). Example: ${formData.collegeRegNo}_Resume.pdf`
    }

    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-generate college email when registration number changes
      if (field === "collegeRegNo") {
        updated.collegeEmail = generateCollegeEmail(value)
      }

      return updated
    })
    setError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const error = validateResume(file)
      if (error) {
        setResumeError(error)
        setResumeFile(null)
      } else {
        setResumeError("")
        setResumeFile(file)
        setSkipResume(false)
      }
    }
  }

  const handleRemoveResume = () => {
    setResumeFile(null)
    setResumeError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.firstName || !formData.gender || !formData.collegeRegNo || !formData.pwd) {
          setError("Please fill in all required fields")
          return false
        }
        if (!validateRegNo(formData.collegeRegNo)) {
          setError("Invalid registration number format (e.g., 22ETCS001234)")
          return false
        }
        break
      case 2:
        if (!formData.dateOfBirth || !formData.collegeEmail || !formData.personalEmail || !formData.mobileNumber) {
          setError("Please fill in all required fields")
          return false
        }
        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.personalEmail)) {
          setError("Please enter a valid personal email address")
          return false
        }
        // Validate mobile number
        const mobileRegex = /^[+]?[0-9]{10,15}$/
        if (!mobileRegex.test(formData.mobileNumber.replace(/\s/g, ""))) {
          setError("Please enter a valid mobile number")
          return false
        }
        break
      case 3:
        if (!formData.branch || !formData.ugPercentage || !formData.activeBacklogs) {
          setError("Please fill in all required fields")
          return false
        }
        if (Number.parseFloat(formData.ugPercentage) < 0 || Number.parseFloat(formData.ugPercentage) > 100) {
          setError("UG Percentage must be between 0 and 100")
          return false
        }
        break
      case 4:
        // Resume is optional now
        return true
    }
    setError("")
    return true
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)
    try {
      // Get current user (mock for demo)
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()
      const userId = user?.id || generateUUID()

      // Handle resume upload if file is provided using branch-wise storage
      let resumeUrl = ""
      if (resumeFile) {
        try {
          const { publicUrl } = await uploadResume(resumeFile, formData.branch, formData.collegeRegNo)
          resumeUrl = publicUrl
        } catch (uploadError) {
          console.warn("Resume upload failed, continuing without resume:", uploadError)
          resumeUrl = ""
        }
      }

      // Insert student details with proper UUID
      const studentData = {
        id: generateUUID(),
        user_id: userId,
        first_name: formData.firstName,
        gender: formData.gender as "Male" | "Female" | "Other",
        college_reg_no: formData.collegeRegNo.toUpperCase(),
        pwd: formData.pwd === "yes",
        date_of_birth: formData.dateOfBirth,
        college_email: formData.collegeEmail,
        personal_email: formData.personalEmail,
        mobile_number: formData.mobileNumber,
        branch: formData.branch,
        ug_percentage: Number.parseFloat(formData.ugPercentage),
        active_backlogs: formData.activeBacklogs === "yes",
        resume_url: resumeUrl,
        placement_status: {
          offers: [],
          accepted_offers: 0,
          max_ctc: 0,
          max_offers_allowed: 3,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabaseClient.from("student_details").insert(studentData)

      if (insertError) throw insertError

      // Store student data in localStorage for demo
      localStorage.setItem("student_profile", JSON.stringify(studentData))

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Gender *</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collegeRegNo">College Registration Number *</Label>
              <Input
                id="collegeRegNo"
                value={formData.collegeRegNo}
                onChange={(e) => handleInputChange("collegeRegNo", e.target.value.toUpperCase())}
                placeholder="22ETCS001234"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500">Format: 22ETCS001234</p>
            </div>

            <div className="space-y-3">
              <Label>Person with Disability (PWD) *</Label>
              <RadioGroup
                value={formData.pwd}
                onValueChange={(value) => handleInputChange("pwd", value)}
                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
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
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collegeEmail">College Email ID *</Label>
              <Input
                id="collegeEmail"
                type="email"
                value={formData.collegeEmail}
                readOnly
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Auto-generated from registration number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email *</Label>
              <Input
                id="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                placeholder="your.email@gmail.com"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input
                id="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                placeholder="+91 9876543210"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch *</Label>
              <Select value={formData.branch} onValueChange={(value) => handleInputChange("branch", value)}>
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select your branch" />
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
              <Label htmlFor="ugPercentage">UG Percentage *</Label>
              <Input
                id="ugPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.ugPercentage}
                onChange={(e) => handleInputChange("ugPercentage", e.target.value)}
                placeholder="85.5"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Active Backlogs *</Label>
              <RadioGroup
                value={formData.activeBacklogs}
                onValueChange={(value) => handleInputChange("activeBacklogs", value)}
                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
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
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resume Upload (Optional)</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can upload your resume now or add it later from your profile. However, you'll need to complete your
                profile before applying for jobs.
              </p>

              {!skipResume && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center">
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                  {resumeFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 break-all">
                        {resumeFile.name}
                      </p>
                      <p className="text-xs text-gray-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          Change File
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveResume}
                          className="text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <FileText className="w-4 h-4 mr-2" />
                          Choose PDF File
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Max size: 2MB | PDF only</p>
                    </div>
                  )}
                </div>
              )}

              {!resumeFile && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSkipResume(!skipResume)}
                    className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {skipResume ? "Upload Resume Instead" : "Skip Resume Upload"}
                  </Button>
                </div>
              )}

              {skipResume && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    You can add your resume later from your profile. Remember to complete your profile before applying
                    for jobs.
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Resume Guidelines:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• File must be in PDF format</li>
                  <li>• Maximum file size: 2MB</li>
                  <li>• Filename should contain your registration number ({formData.collegeRegNo})</li>
                  <li>• Example: {formData.collegeRegNo}_Resume.pdf</li>
                  <li>
                    • Will be stored in: /placements/resumes/
                    {formData.branch?.toLowerCase().replace(/\s+/g, "-") || "your-branch"}/
                  </li>
                </ul>
              </div>

              {resumeError && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">{resumeError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Registration
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Complete your profile to access placement opportunities
            </CardDescription>
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-4 sm:px-6">
            {renderStep()}

            {error && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="w-full sm:w-auto bg-transparent"
              >
                Previous
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                >
                  {isLoading ? "Submitting..." : "Complete Registration"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
