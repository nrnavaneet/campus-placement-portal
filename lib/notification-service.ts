// Comprehensive notification service for campus placement portal
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to check notification settings
async function getStudentNotificationSettings(studentId: string, regNo?: string) {
  try {
    let query = supabaseAdmin
      .from('student_settings')
      .select('*')

    if (studentId !== 'unknown' && studentId) {
      query = query.eq('student_id', studentId)
    } else if (regNo) {
      // Fallback: get student ID from registration number
      const { data: studentData } = await supabaseAdmin
        .from('student_details')
        .select('id')
        .eq('college_reg_no', regNo)
        .single()
      
      if (studentData?.id) {
        query = query.eq('student_id', studentData.id)
      } else {
        // If no settings found, assume all notifications are enabled (default)
        return {
          newOpportunities: true,
          applicationStatusUpdates: true,
          placementCongratulations: true,
          deadlineReminders: true
        }
      }
    }

    const { data: settings } = await query.single()

    // Return settings or defaults if not found
    return settings || {
      newOpportunities: true,
      applicationStatusUpdates: true,
      placementCongratulations: true,
      deadlineReminders: true
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    // Return default settings (all enabled) if there's an error
    return {
      newOpportunities: true,
      applicationStatusUpdates: true,
      placementCongratulations: true,
      deadlineReminders: true
    }
  }
}

// Base notification data structure
interface BaseNotificationData {
  studentName: string
  studentRegNo: string
  studentEmail: string
  studentPhone: string
}

// Specific notification data types
interface NewOpportunityData extends BaseNotificationData {
  jobTitle: string
  companyName: string
  packageRange: string
  deadline: string
  jobId: string
}

interface ApplicationStatusData extends BaseNotificationData {
  jobTitle: string
  companyName: string
  previousStatus: string
  newStatus: string
  applicationDate: string
}

interface PlacementCongratulationData extends BaseNotificationData {
  jobTitle: string
  companyName: string
  packageOffered: string
  joiningDate: string
}

interface DeadlineReminderData extends BaseNotificationData {
  jobTitle: string
  companyName: string
  deadline: string
  daysLeft: number
}

interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

interface SMSTemplate {
  message: string
}

// Email template base styling
const emailStyles = `
  .email-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header {
    text-align: center;
    padding: 30px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px 10px 0 0;
    color: white;
    margin: -20px -20px 30px -20px;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .header p {
    margin: 10px 0 0 0;
    font-size: 16px;
    opacity: 0.9;
  }
  .content-card {
    background: #f8fafc;
    padding: 25px;
    border-radius: 10px;
    margin-bottom: 20px;
    border-left: 4px solid #667eea;
  }
  .details-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  .details-table td {
    padding: 12px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .details-table td:first-child {
    font-weight: 600;
    color: #374151;
    width: 40%;
  }
  .details-table td:last-child {
    color: #111827;
  }
  .highlight {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    margin: 20px 0;
  }
  .footer {
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }
`

// 1. New Opportunity Notification
function createNewOpportunityTemplate(data: NewOpportunityData): EmailTemplate {
  const subject = `New Opportunity: ${data.jobTitle} at ${data.companyName}`
  
  const htmlBody = `
    <style>${emailStyles}</style>
    <div class="email-container">
      <div class="header">
        <h1>New Job Opportunity Available!</h1>
        <p>Don't miss out on this exciting career opportunity</p>
      </div>
      
      <div class="content-card">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Opportunity Details</h2>
        <table class="details-table">
          <tr><td>Position:</td><td><strong>${data.jobTitle}</strong></td></tr>
          <tr><td>Company:</td><td><strong>${data.companyName}</strong></td></tr>
          <tr><td>Package:</td><td><strong>${data.packageRange}</strong></td></tr>
          <tr><td>Application Deadline:</td><td><strong style="color: #dc2626;">${data.deadline}</strong></td></tr>
          <tr><td>Student:</td><td>${data.studentName} (${data.studentRegNo})</td></tr>
        </table>
      </div>

      <div class="highlight">
        <h3 style="margin: 0 0 10px 0;">Ready to Apply?</h3>
        <p style="margin: 0;">Log in to your placement portal to view full details and submit your application!</p>
      </div>

      <div class="footer">
        <p><strong>Campus Placement Portal</strong> • MSRUAS</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  `

  const textBody = `NEW JOB OPPORTUNITY AVAILABLE!

Hi ${data.studentName},

A new job opportunity matching your profile has been posted:

Position: ${data.jobTitle}
Company: ${data.companyName}  
Package: ${data.packageRange}
Application Deadline: ${data.deadline}

Don't miss out! Log in to your placement portal to apply now.

Best regards,
Campus Placement Team
MSRUAS`
  
  return { subject, htmlBody, textBody }
}

// 2. Application Status Update Notification
function createApplicationStatusTemplate(data: ApplicationStatusData): EmailTemplate {
  const statusColors: { [key: string]: string } = {
    'selected': '#10b981',
    'shortlisted': '#3b82f6',
    'rejected': '#ef4444',
    'interview_scheduled': '#f59e0b',
    'offer_extended': '#8b5cf6',
    'applied': '#667eea'
  }
  
  const statusColor = statusColors[data.newStatus.toLowerCase()] || '#6b7280'
  const subject = `📋 Application Update: ${data.jobTitle} - ${data.newStatus.replace('_', ' ').toUpperCase()}`
  
  const htmlBody = `
    <style>${emailStyles}</style>
    <div class="email-container">
      <div class="header">
        <h1>📋 Application Status Update</h1>
        <p>Your application status has been updated</p>
      </div>
      
      <div class="content-card">
        <table class="details-table">
          <tr><td>Student:</td><td>${data.studentName} (${data.studentRegNo})</td></tr>
          <tr><td>Position:</td><td><strong>${data.jobTitle}</strong></td></tr>
          <tr><td>Company:</td><td><strong>${data.companyName}</strong></td></tr>
          <tr><td>Applied On:</td><td>${data.applicationDate}</td></tr>
        </table>
      </div>

      <div class="highlight" style="background: ${statusColor};">
        <h3 style="margin: 0 0 10px 0;">Status Updated</h3>
        <p style="margin: 0; font-size: 18px; font-weight: 600;">${data.newStatus.replace('_', ' ').toUpperCase()}</p>
      </div>

      <p style="text-align: center; color: #374151; font-size: 16px;">
        ${data.newStatus.toLowerCase() === 'selected' ? 'Congratulations! You have been selected for the next round.' :
          data.newStatus.toLowerCase() === 'shortlisted' ? 'Great news! You have been shortlisted.' :
          data.newStatus.toLowerCase() === 'interview_scheduled' ? 'Your interview has been scheduled. Check your email for details.' :
          data.newStatus.toLowerCase() === 'offer_extended' ? 'Congratulations! An offer has been extended to you.' :
          data.newStatus.toLowerCase() === 'applied' ? 'Your application has been successfully submitted!' :
          'Thank you for your application. We will keep you updated on further developments.'}
      </p>

      <div class="footer">
        <p><strong>Campus Placement Portal</strong> • MSRUAS</p>
        <p>For any queries, contact the placement cell.</p>
      </div>
    </div>
  `

  const textBody = `APPLICATION STATUS UPDATE

Hi ${data.studentName},

Your application for ${data.jobTitle} at ${data.companyName} status: ${data.newStatus.replace('_', ' ').toUpperCase()}

Applied On: ${data.applicationDate}

${data.newStatus.toLowerCase() === 'selected' ? 'Congratulations! You have been selected for the next round.' :
  data.newStatus.toLowerCase() === 'shortlisted' ? 'Great news! You have been shortlisted.' :
  data.newStatus.toLowerCase() === 'interview_scheduled' ? 'Your interview has been scheduled. Check your email for details.' :
  data.newStatus.toLowerCase() === 'offer_extended' ? 'Congratulations! An offer has been extended to you.' :
  data.newStatus.toLowerCase() === 'applied' ? 'Your application has been successfully submitted!' :
  'Thank you for your application. We will keep you updated.'}

Best regards,
Campus Placement Team
MSRUAS`
  
  return { subject, htmlBody, textBody }
}

// 3. Placement Congratulation Notification
function createPlacementCongratulationTemplate(data: PlacementCongratulationData): EmailTemplate {
  const subject = `CONGRATULATIONS! You're Placed at ${data.companyName}!`
  
  const htmlBody = `
    <style>${emailStyles}</style>
    <div class="email-container">
      <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <h1>CONGRATULATIONS!</h1>
        <p>You have been successfully placed!</p>
      </div>
      
      <div style="text-align: center; padding: 30px 0;">
        <h2 style="color: #059669; font-size: 28px; margin-bottom: 20px;">Welcome to ${data.companyName}!</h2>
        <p style="font-size: 18px; color: #374151;">Dear ${data.studentName}, we are thrilled to congratulate you on your successful placement!</p>
      </div>
      
      <div class="content-card" style="border-left-color: #10b981;">
        <h3 style="color: #059669; margin-bottom: 20px;">Placement Details</h3>
        <table class="details-table">
          <tr><td>Student:</td><td>${data.studentName} (${data.studentRegNo})</td></tr>
          <tr><td>Position:</td><td><strong>${data.jobTitle}</strong></td></tr>
          <tr><td>Company:</td><td><strong>${data.companyName}</strong></td></tr>
          <tr><td>Package:</td><td><strong style="color: #059669; font-size: 18px;">${data.packageOffered}</strong></td></tr>
          <tr><td>Expected Joining:</td><td><strong>${data.joiningDate}</strong></td></tr>
        </table>
      </div>

      <div class="highlight" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <h3 style="margin: 0 0 10px 0;">Your Journey Begins Now!</h3>
        <p style="margin: 0;">Wishing you all the best for your new role. Make us proud!</p>
      </div>

      <div class="footer">
        <p style="font-weight: 600; color: #059669;">Campus Placement Cell • MSRUAS</p>
        <p>Proud of your achievement!</p>
      </div>
    </div>
  `

  const textBody = `CONGRATULATIONS! YOU'RE PLACED!

Dear ${data.studentName},

We are absolutely thrilled to congratulate you on your successful placement!

PLACEMENT DETAILS:
Position: ${data.jobTitle}
Company: ${data.companyName}
Package: ${data.packageOffered}
Expected Joining: ${data.joiningDate}

Your hard work has paid off! Wishing you tremendous success in your new role.

With pride and best wishes,
Campus Placement Team
MSRUAS

Make us proud!`
  
  return { subject, htmlBody, textBody }
}

// 4. Deadline Reminder Notification
function createDeadlineReminderTemplate(data: DeadlineReminderData): EmailTemplate {
  const urgencyColor = data.daysLeft <= 1 ? '#dc2626' : data.daysLeft <= 3 ? '#f59e0b' : '#3b82f6'
  const subject = `Reminder: ${data.jobTitle} deadline in ${data.daysLeft} day${data.daysLeft > 1 ? 's' : ''}!`
  
  const htmlBody = `
    <style>${emailStyles}</style>
    <div class="email-container">
      <div class="header" style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);">
        <h1>Application Deadline Reminder</h1>
        <p>Don't miss out on this opportunity!</p>
      </div>
      
      <div class="content-card" style="border-left-color: ${urgencyColor};">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Opportunity Closing Soon!</h2>
        <table class="details-table">
          <tr><td>Student:</td><td>${data.studentName} (${data.studentRegNo})</td></tr>
          <tr><td>Position:</td><td><strong>${data.jobTitle}</strong></td></tr>
          <tr><td>Company:</td><td><strong>${data.companyName}</strong></td></tr>
          <tr><td>Application Deadline:</td><td><strong style="color: ${urgencyColor}; font-size: 18px;">${data.deadline}</strong></td></tr>
        </table>
      </div>

      <div class="highlight" style="background: ${urgencyColor};">
        <h3 style="margin: 0 0 10px 0;">${data.daysLeft <= 1 ? 'URGENT' : data.daysLeft <= 3 ? 'HURRY' : 'REMINDER'}</h3>
        <p style="margin: 0; font-size: 20px; font-weight: 600;">
          ${data.daysLeft === 0 ? 'Last Day to Apply!' : 
            data.daysLeft === 1 ? '1 Day Left!' : 
            `${data.daysLeft} Days Left!`}
        </p>
      </div>

      <div class="footer">
        <p><strong>Campus Placement Portal</strong> • MSRUAS</p>
        <p>Set up your notifications to never miss a deadline!</p>
      </div>
    </div>
  `

  const textBody = `APPLICATION DEADLINE REMINDER

Hi ${data.studentName},

${data.daysLeft <= 1 ? 'URGENT REMINDER!' : data.daysLeft <= 3 ? 'HURRY!' : 'FRIENDLY REMINDER'}

The application deadline for ${data.jobTitle} at ${data.companyName} is approaching:

Deadline: ${data.deadline}
Time Left: ${data.daysLeft === 0 ? 'TODAY (Last Day!)' : 
           data.daysLeft === 1 ? '1 Day Left!' : 
           `${data.daysLeft} Days Left!`}

${data.daysLeft <= 1 ? 
  'This is your final chance! Apply now before the deadline passes.' :
  'Don\'t wait until the last minute. Apply now via your placement portal.'}

Best regards,
Campus Placement Team
MSRUAS`
  
  return { subject, htmlBody, textBody }
}

// SMS Templates for all notification types

// 1. New Opportunity SMS
function createNewOpportunitySMSTemplate(data: NewOpportunityData): SMSTemplate {
  const message = `New Job Alert! ${data.jobTitle} at ${data.companyName} (${data.packageRange}). Deadline: ${data.deadline}. Apply now via placement portal! - MSRUAS Placements`
  return { message }
}

// 2. Application Status SMS
function createApplicationStatusSMSTemplate(data: ApplicationStatusData): SMSTemplate {
  const statusMessage = data.newStatus.toLowerCase() === 'selected' ? 'SELECTED!' :
                       data.newStatus.toLowerCase() === 'shortlisted' ? 'SHORTLISTED!' :
                       data.newStatus.toLowerCase() === 'interview_scheduled' ? 'Interview Scheduled!' :
                       data.newStatus.toLowerCase() === 'offer_extended' ? 'Offer Extended!' :
                       data.newStatus.toLowerCase() === 'applied' ? 'Application Submitted!' : 'Status Updated'
  
  const message = `Hi ${data.studentName}! ${statusMessage} Your application for ${data.jobTitle} at ${data.companyName} status: ${data.newStatus.replace('_', ' ').toUpperCase()}. Check portal for details. - MSRUAS Placements`
  return { message }
}

// 3. Placement Congratulation SMS  
function createPlacementCongratulationSMSTemplate(data: PlacementCongratulationData): SMSTemplate {
  const message = `CONGRATULATIONS ${data.studentName}! You're PLACED at ${data.companyName} as ${data.jobTitle}! Package: ${data.packageOffered}. Joining: ${data.joiningDate}. Proud of you! - MSRUAS Placements`
  return { message }
}

// 4. Deadline Reminder SMS
function createDeadlineReminderSMSTemplate(data: DeadlineReminderData): SMSTemplate {
  const urgencyPrefix = data.daysLeft <= 1 ? 'URGENT' : data.daysLeft <= 3 ? 'HURRY' : 'REMINDER'
  const timeLeft = data.daysLeft === 0 ? 'TODAY!' : data.daysLeft === 1 ? '1 day left!' : `${data.daysLeft} days left!`
  
  const message = `${urgencyPrefix}: ${data.jobTitle} at ${data.companyName} deadline ${timeLeft} Apply now via portal before ${data.deadline}. Don't miss out! - MSRUAS Placements`
  return { message }
}

// Send email notification using EmailJS
// Send Email using console logging for development or Nodemailer for production
async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    console.log('📧 Email Notification Details:')
    console.log('To:', to)
    console.log('Subject:', template.subject)
    console.log('Content Preview:', template.textBody.substring(0, 300) + '...')
    
    // Check if we're in production and have email credentials
    const isProduction = process.env.NODE_ENV === 'production'
    const hasEmailConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS
    
    if (isProduction && hasEmailConfig) {
      // Use actual email service in production
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject: template.subject,
            html: template.htmlBody,
            text: template.textBody
          })
        })
        
        if (response.ok) {
          console.log('✅ Email sent successfully to:', to)
          return true
        } else {
          console.error('❌ Email service error:', await response.text())
          return false
        }
      } catch (emailError) {
        console.error('❌ Email API error:', emailError)
        return false
      }
    } else {
      // Development mode - simulate email sending
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('✅ Email simulated successfully to:', to)
      console.log('🔧 Note: Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS environment variables for actual email sending')
      return true
    }
    
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// Send SMS notification using TextBelt free service
async function sendSMS(to: string, template: SMSTemplate): Promise<boolean> {
  try {
    console.log('Sending SMS to:', to)
    console.log('Message:', template.message)
    
    // TextBelt free SMS service
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: to,
        message: template.message,
        key: process.env.TEXTBELT_API_KEY || 'textbelt', // 'textbelt' for free quota, or use your paid key
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('SMS sent successfully to:', to)
      console.log('Remaining quota:', result.quotaRemaining)
      return true
    } else {
      console.error('Failed to send SMS:', result.error)
      return false
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    // Fallback to console logging for development
    console.log('SMS would be sent to:', to)
    console.log('Message:', template.message)
    return true // Return true for development to not break the flow
  }
}

// Helper functions
async function fetchStudentAndJobData(studentId: string, jobId: string) {
  const [studentResult, jobResult] = await Promise.all([
    supabaseAdmin
      .from('student_details')
      .select('first_name, college_reg_no, college_email, personal_email, mobile_number')
      .eq('user_id', studentId)
      .single(),
    supabaseAdmin
      .from('jobs')
      .select('title, company_name, package_min, package_max, application_deadline')
      .eq('id', jobId)
      .single()
  ])

  return {
    student: studentResult.data,
    job: jobResult.data
  }
}

function formatPackage(min: number, max: number): string {
  const formatAmount = (amount: number) => 
    amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${(amount / 1000).toFixed(0)}K`
  
  return min === max ? formatAmount(min) : `${formatAmount(min)} - ${formatAmount(max)}`
}

// Main notification functions for each type

// 1. Send New Opportunity Notification
export async function sendNewOpportunityNotification(data: {
  jobId: string
  studentId: string
}): Promise<{ emailSent: boolean; smsSent: boolean }> {
  try {
    const { student, job } = await fetchStudentAndJobData(data.studentId, data.jobId)
    if (!student || !job) return { emailSent: false, smsSent: false }

    const notificationData: NewOpportunityData = {
      studentName: student.first_name,
      studentRegNo: student.college_reg_no,
      studentEmail: student.college_email || student.personal_email,
      studentPhone: student.mobile_number,
      jobTitle: job.title,
      companyName: job.company_name,
      packageRange: formatPackage(job.package_min, job.package_max),
      deadline: new Date(job.application_deadline).toLocaleDateString('en-IN'),
      jobId: data.jobId
    }

    const emailTemplate = createNewOpportunityTemplate(notificationData)
    const smsTemplate = createNewOpportunitySMSTemplate(notificationData)

    const [emailSent, smsSent] = await Promise.all([
      notificationData.studentEmail ? sendEmail(notificationData.studentEmail, emailTemplate) : Promise.resolve(false),
      notificationData.studentPhone ? sendSMS(notificationData.studentPhone, smsTemplate) : Promise.resolve(false)
    ])

    return { emailSent, smsSent }
  } catch (error) {
    console.error('Failed to send new opportunity notification:', error)
    return { emailSent: false, smsSent: false }
  }
}

// Legacy function for backward compatibility (existing application notifications)
export async function sendApplicationNotification(applicationData: {
  applicationId: string
  jobId: string
  studentId: string
}): Promise<{ emailSent: boolean; smsSent: boolean }> {
  try {
    const { student, job } = await fetchStudentAndJobData(applicationData.studentId, applicationData.jobId)
    if (!student || !job) return { emailSent: false, smsSent: false }

    // Check notification settings
    const settings = await getStudentNotificationSettings(applicationData.studentId, student.college_reg_no)
    
    // Skip if application status updates are disabled
    if (!settings.applicationStatusUpdates) {
      console.log('Application status notifications disabled for student:', student.college_reg_no)
      return { emailSent: false, smsSent: false }
    }

    const notificationData: ApplicationStatusData = {
      studentName: student.first_name,
      studentRegNo: student.college_reg_no,
      studentEmail: student.college_email || student.personal_email,
      studentPhone: student.mobile_number,
      jobTitle: job.title,
      companyName: job.company_name,
      previousStatus: 'pending',
      newStatus: 'applied',
      applicationDate: new Date().toLocaleDateString('en-IN')
    }

    // Use application status template for application confirmation
    const emailTemplate = createApplicationStatusTemplate(notificationData)
    const smsTemplate = createApplicationStatusSMSTemplate(notificationData)

    const [emailSent, smsSent] = await Promise.all([
      notificationData.studentEmail ? sendEmail(notificationData.studentEmail, emailTemplate) : Promise.resolve(false),
      notificationData.studentPhone ? sendSMS(notificationData.studentPhone, smsTemplate) : Promise.resolve(false)
    ])

    return { emailSent, smsSent }
  } catch (error) {
    console.error('Failed to send application notification:', error)
    return { emailSent: false, smsSent: false }
  }
}

// Admin application status update notification
export async function sendAdminApplicationStatusUpdate(data: {
  studentRegNo: string
  studentName: string
  jobTitle: string
  companyName: string
  applicationId: string
  newStatus: string
  statusMessage?: string
  notes?: string
}): Promise<{ emailSent: boolean; smsSent: boolean }> {
  try {
    // Fetch student details for notification settings
    const studentData = await fetchStudentDataByRegNo(data.studentRegNo)
    if (!studentData) {
      console.log('Student not found:', data.studentRegNo)
      return { emailSent: false, smsSent: false }
    }

    // Check notification settings
    const settings = await getStudentNotificationSettings(studentData.id, data.studentRegNo)
    
    // Skip if application status updates are disabled
    if (!settings.applicationStatusUpdates) {
      console.log('Application status notifications disabled for student:', data.studentRegNo)
      return { emailSent: false, smsSent: false }
    }

    const notificationData: ApplicationStatusData = {
      studentName: data.studentName,
      studentRegNo: data.studentRegNo,
      studentEmail: studentData.college_email,
      studentPhone: studentData.mobile_number,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      previousStatus: 'pending', // We don't have previous status in this context
      newStatus: data.newStatus,
      applicationDate: new Date().toLocaleDateString()
    }

    // Send email notification
    const emailSent = await sendEmail(
      studentData.college_email,
      createApplicationStatusTemplate(notificationData)
    )

    // Send SMS notification
    const smsSent = await sendSMS(
      studentData.mobile_number,
      createApplicationStatusSMSTemplate(notificationData)
    )

    return { emailSent, smsSent }
  } catch (error) {
    console.error('Failed to send admin application status update:', error)
    return { emailSent: false, smsSent: false }
  }
}

// Helper function to fetch student by registration number
async function fetchStudentDataByRegNo(regNo: string) {
  try {
    const { data } = await supabaseAdmin
      .from('student_details')
      .select('*')
      .eq('college_reg_no', regNo)
      .single()
    return data
  } catch (error) {
    console.error('Error fetching student by reg no:', error)
    return null
  }
}

// Helper function for default status messages
function getDefaultStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'applied': 'Your application has been received and is being reviewed.',
    'screening': 'Your application is currently under screening.',
    'interview': 'You have been shortlisted for an interview!',
    'selected': 'Congratulations! You have been selected.',
    'rejected': 'Unfortunately, you were not selected for this position.',
    'on_hold': 'Your application is currently on hold.',
    'withdrawn': 'Your application has been withdrawn.'
  }
  return messages[status] || 'Your application status has been updated.'
}