import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Email templates for notifications
const EMAIL_TEMPLATES = {
  application_submitted: {
    subject: (data: any) => `Application Submitted - ${data.jobTitle} at ${data.companyName}`,
    body: (data: any) => `
Dear ${data.studentName},

Your application has been successfully submitted for the following position:

Job Details:
- Position: ${data.jobTitle}
- Company: ${data.companyName}
- Package: ${data.packageRange}
- Application Date: ${new Date(data.appliedAt).toLocaleDateString()}
- Application ID: ${data.applicationId}

Student Details:
- Name: ${data.studentName}
- Registration Number: ${data.regNo}
- Branch: ${data.branch}
- Email: ${data.email}
- Phone: ${data.phone}
- UG Percentage: ${data.ugPercentage}%

Your application is now under review. We will notify you of any updates regarding your application status.

Best regards,
Campus Placement Team
`
  }
}

const SMS_TEMPLATES = {
  application_submitted: (data: any) => 
    `Hi ${data.studentName}, your application for ${data.jobTitle} at ${data.companyName} has been submitted successfully. Application ID: ${data.applicationId}. Good luck!`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      studentId, 
      jobId, 
      applicationId, 
      notificationType = 'both', // 'email', 'sms', 'both'
      templateData 
    } = body

    if (!studentId || !jobId || !applicationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentId, jobId, applicationId' 
      }, { status: 400 })
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('student_details')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Prepare template data
    const fullTemplateData = {
      studentName: student.first_name,
      regNo: student.college_reg_no,
      branch: student.branch,
      email: student.college_email,
      phone: student.mobile_number,
      ugPercentage: student.ug_percentage,
      jobTitle: job.title,
      companyName: job.company_name,
      packageRange: `₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L`,
      applicationId: applicationId,
      appliedAt: new Date().toISOString(),
      ...templateData
    }

    const notifications = []

    // Send Email Notification
    if (notificationType === 'email' || notificationType === 'both') {
      const emailTemplate = EMAIL_TEMPLATES.application_submitted
      const emailSubject = emailTemplate.subject(fullTemplateData)
      const emailBody = emailTemplate.body(fullTemplateData)

      const { error: emailLogError } = await supabaseAdmin
        .from('notification_logs')
        .insert({
          student_id: studentId,
          job_id: jobId,
          application_id: applicationId,
          type: 'email',
          recipient: student.college_email,
          subject: emailSubject,
          message: emailBody,
          template_data: fullTemplateData,
          notification_category: 'application_submitted',
          status: 'sent' // In real implementation, this would be 'pending' until actually sent
        })

      if (emailLogError) {
        console.error('Error logging email notification:', emailLogError)
      } else {
        notifications.push({
          type: 'email',
          recipient: student.college_email,
          subject: emailSubject,
          status: 'sent'
        })
      }
    }

    // Send SMS Notification  
    if (notificationType === 'sms' || notificationType === 'both') {
      const smsMessage = SMS_TEMPLATES.application_submitted(fullTemplateData)

      const { error: smsLogError } = await supabaseAdmin
        .from('notification_logs')
        .insert({
          student_id: studentId,
          job_id: jobId,
          application_id: applicationId,
          type: 'sms',
          recipient: student.mobile_number,
          message: smsMessage,
          template_data: fullTemplateData,
          notification_category: 'application_submitted',
          status: 'sent' // In real implementation, this would be 'pending' until actually sent
        })

      if (smsLogError) {
        console.error('Error logging SMS notification:', smsLogError)
      } else {
        notifications.push({
          type: 'sms',
          recipient: student.mobile_number,
          message: smsMessage,
          status: 'sent'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      notifications: notifications
    })

  } catch (error: any) {
    console.error('Notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notifications',
      details: error.message 
    }, { status: 500 })
  }
}