import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ResumePreviewDialog } from './resume-preview-dialog'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import type { Job, StudentDetails } from '@/lib/supabase'
import {
  CheckCircle,
  AlertCircle,
  Building,
  IndianRupee,
  Calendar,
  GraduationCap,
  FileText,
  Users,
  Clock,
  Eye,
  Download,
} from 'lucide-react'

interface JobApplicationDialogProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  onApplicationSuccess: () => void
}

export function JobApplicationDialog({
  isOpen,
  onClose,
  job,
  onApplicationSuccess
}: JobApplicationDialogProps) {
  const { student: authenticatedStudent } = useAuth()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [eligibilityCheck, setEligibilityCheck] = useState({ eligible: false, reasons: [] as string[] })
  const [confirmations, setConfirmations] = useState({
    eligibility: false,
    documents: false,
    terms: false,
    resumeVerified: false,
  })
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false)

  useEffect(() => {
    if (isOpen && job) {
      fetchStudentData()
    }
  }, [isOpen, job])

  const fetchStudentData = async () => {
    if (!authenticatedStudent) {
      toast.error("Please log in to view job details")
      onClose()
      return
    }

    try {
      setIsLoading(true)
      setStudent(authenticatedStudent)
      checkEligibility(job!, authenticatedStudent)
      checkExistingApplication(authenticatedStudent.college_reg_no)
    } catch (error) {
      console.error("Error loading student data:", error)
      toast.error("Failed to load student profile")
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingApplication = async (studentRegNo: string) => {
    try {
      const response = await fetch(`/api/student/applications?student_id=${studentRegNo}`)
      if (response.ok) {
        const data = await response.json()
        const existingApp = data.data?.find((app: any) => app.job_id === job?.id)
        setHasApplied(!!existingApp)
      }
    } catch (error) {
      console.error('Error checking existing application:', error)
      setHasApplied(false)
    }
  }

  const checkEligibility = (jobData: Job, studentData: StudentDetails) => {
    const reasons: string[] = []
    let eligible = true

    // Check branch
    if (!jobData.branches_allowed.includes(studentData.branch)) {
      eligible = false
      reasons.push(`Your branch (${studentData.branch}) is not eligible for this position`)
    }

    // Check percentage
    if (studentData.ug_percentage < jobData.min_ug_percentage) {
      eligible = false
      reasons.push(
        `UG percentage requirement not met (Required: ${jobData.min_ug_percentage}%, You have: ${studentData.ug_percentage}%)`,
      )
    }

    // Check backlogs
    if (jobData.no_backlogs_required && studentData.active_backlogs) {
      eligible = false
      reasons.push("Active backlogs not allowed for this position")
    }

    // Check resume
    if (!studentData.resume_url) {
      eligible = false
      reasons.push("Resume not uploaded")
    }

    setEligibilityCheck({ eligible, reasons })
  }

  const handleApply = async () => {
    if (!student || !job) return

    setIsApplying(true)
    try {
      const response = await fetch('/api/student/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.college_reg_no,
          job_id: job.id
        }),
      })

      if (response.ok) {
        setHasApplied(true)
        onApplicationSuccess()
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('Application failed:', errorData)
        if (errorData.error?.includes('already submitted')) {
          toast.error('You have already applied for this position.')
        } else {
          toast.error('Failed to submit application. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  const canApply = eligibilityCheck.eligible && 
                 confirmations.eligibility && 
                 confirmations.documents && 
                 confirmations.terms &&
                 confirmations.resumeVerified &&
                 !hasApplied

  const handleDownloadResume = async () => {
    if (!student?.college_reg_no) return
    try {
      // Use admin API for resume download to avoid bucket issues
      const response = await fetch(`/api/admin/resume/download?regNo=${student.college_reg_no}`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${student.college_reg_no}_Resume.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (!job) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Apply for {job.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Summary */}
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="w-5 h-5" />
                  {job.company_name}
                </CardTitle>
                <CardDescription className="text-base">{job.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <span>₹{(job.package_min / 100000).toFixed(1)}L - ₹{(job.package_max / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>Min {job.min_ug_percentage}% required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span>{job.branches_allowed.join(', ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Check */}
            <Card className={eligibilityCheck.eligible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {eligibilityCheck.eligible ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Eligibility Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eligibilityCheck.eligible ? (
                  <p className="text-green-800">You are eligible to apply for this position!</p>
                ) : (
                  <div>
                    <p className="text-red-800 font-medium mb-2">You are not eligible for this position:</p>
                    <ul className="text-red-700 space-y-1">
                      {eligibilityCheck.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500">•</span>
                          <span className="text-sm">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume Section */}
            {student && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Verification
                  </CardTitle>
                  <CardDescription>
                    Please verify your resume before submitting the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.resume_url ? (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">Resume Available</p>
                          <p className="text-xs text-green-600">Your resume is ready for submission</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsResumePreviewOpen(true)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadResume}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                        <Checkbox
                          id="resume-verified"
                          checked={confirmations.resumeVerified}
                          onCheckedChange={(checked) =>
                            setConfirmations((prev) => ({ ...prev, resumeVerified: !!checked }))
                          }
                          className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label 
                            htmlFor="resume-verified"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            I confirm that my uploaded resume is final and verified
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Please ensure your resume is up-to-date and contains all relevant information before proceeding.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">Resume Not Available</p>
                        <p className="text-xs text-red-600">Please upload your resume in the profile section</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Application Status */}
            {hasApplied && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  You have successfully applied for this position. Check your applications page for updates.
                </AlertDescription>
              </Alert>
            )}

            {/* Confirmations */}
            {eligibilityCheck.eligible && !hasApplied && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Confirmations</CardTitle>
                  <CardDescription>Please confirm the following before applying</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="eligibility"
                      checked={confirmations.eligibility}
                      onCheckedChange={(checked) =>
                        setConfirmations((prev) => ({ ...prev, eligibility: !!checked }))
                      }
                    />
                    <label htmlFor="eligibility" className="text-sm leading-relaxed cursor-pointer">
                      I confirm that I meet all the eligibility criteria mentioned for this position and understand
                      that providing false information may lead to disqualification.
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="documents"
                      checked={confirmations.documents}
                      onCheckedChange={(checked) =>
                        setConfirmations((prev) => ({ ...prev, documents: !!checked }))
                      }
                    />
                    <label htmlFor="documents" className="text-sm leading-relaxed cursor-pointer">
                      I have uploaded all required documents including my updated resume and academic transcripts.
                      I understand that incomplete applications may be rejected.
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={confirmations.terms}
                      onCheckedChange={(checked) =>
                        setConfirmations((prev) => ({ ...prev, terms: !!checked }))
                      }
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the terms and conditions of the placement process and understand that I am
                      bound by the placement policies of the institution.
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              
              {!hasApplied && (
                <Button
                  onClick={handleApply}
                  disabled={!canApply || isApplying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isApplying ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Resume Preview Dialog */}
        {student?.resume_url && (
          <ResumePreviewDialog
            isOpen={isResumePreviewOpen}
            onClose={() => setIsResumePreviewOpen(false)}
            resumeUrl={`/api/admin/resume/view?regNo=${student.college_reg_no}`}
            studentName={student.first_name}
            studentRegNo={student.college_reg_no}
            onDownload={handleDownloadResume}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}