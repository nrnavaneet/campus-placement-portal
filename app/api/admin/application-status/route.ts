import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to send notification
async function sendStatusUpdateNotification(studentId: string, jobTitle: string, companyName: string, newStatus: string) {
  try {
    // Get student details
    const { data: student } = await supabaseAdmin
      .from('student_details')
      .select('first_name, personal_email, mobile_number')
      .eq('id', studentId)
      .single()

    if (!student) return

    const statusMessages: Record<string, string> = {
      'applied': 'Your application has been received',
      'under_review': 'Your application is under review',
      'shortlisted': 'Congratulations! You have been shortlisted',
      'interview_scheduled': 'Your interview has been scheduled',
      'rejected': 'Unfortunately, your application was not selected',
      'selected': 'Congratulations! You have been selected',
      'offer_made': 'An offer has been made to you',
      'offer_accepted': 'Your offer acceptance has been confirmed',
      'offer_declined': 'Your offer decline has been processed'
    }

    const statusMessage = statusMessages[newStatus] || `Status updated to: ${newStatus}`

    // Send email notification
    const emailPayload = {
      type: 'email',
      recipient: student.personal_email,
      subject: `Application Update - ${companyName}`,
      message: `Dear ${student.first_name},

${statusMessage} for the position of ${jobTitle} at ${companyName}.

Please check your dashboard for more details.

Best regards,
Placement Team`,
      student_id: studentId
    }

    // Send SMS notification
    const smsPayload = {
      type: 'sms',
      recipient: student.mobile_number,
      message: `Hi ${student.first_name}, ${statusMessage} at ${companyName}. Check your dashboard for details.`,
      student_id: studentId
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Send both notifications
    await Promise.all([
      fetch(`${baseUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      }),
      fetch(`${baseUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      })
    ])
  } catch (error) {
    console.error('Error sending status notification:', error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { application_id, status, notes } = await request.json()

    if (!application_id || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    // Valid status values
    const validStatuses = [
      'applied', 'under_review', 'shortlisted', 'interview_scheduled',
      'rejected', 'selected', 'offer_made', 'offer_accepted', 'offer_declined'
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Get current application details
    const { data: currentApp, error: fetchError } = await supabaseAdmin
      .from('application_status')
      .select(`
        *,
        jobs!inner(title, company_name),
        student_details!inner(id, first_name)
      `)
      .eq('id', application_id)
      .single()

    if (fetchError) {
      console.error('Error fetching application:', fetchError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application status
    const { data, error } = await supabaseAdmin
      .from('application_status')
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', application_id)
      .select(`
        *,
        jobs!inner(title, company_name),
        student_details!inner(id, first_name)
      `)
      .single()

    if (error) {
      console.error('Error updating application status:', error)
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      )
    }

    // Log the activity
    const { error: activityError } = await supabaseAdmin
      .from('recent_activities')
      .insert({
        activity_type: 'application_status_updated',
        description: `Application status updated to "${status}" for ${data.jobs.title} at ${data.jobs.company_name}`,
        details: {
          application_id,
          student_id: data.student_id,
          old_status: currentApp.status,
          new_status: status,
          company: data.jobs.company_name,
          position: data.jobs.title
        }
      })

    if (activityError) {
      console.error('Error logging activity:', activityError)
    }

    // Send notification to student
    sendStatusUpdateNotification(
      data.student_id,
      data.jobs.title,
      data.jobs.company_name,
      status
    ).catch(error => console.error('Notification error:', error))

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
      data
    })

  } catch (err) {
    console.error('Application status update API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}