import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to send notification
async function sendApplicationNotification(applicationId: string, jobId: string, studentRegNo: string) {
  // Skip notifications during build
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    return
  }

  try {
    // Get student details by registration number
    const { data: student } = await supabaseAdmin
      .from('student_details')
      .select('user_id, first_name, college_email, personal_email, mobile_number')
      .eq('college_reg_no', studentRegNo)
      .single()

    if (!student) {
      console.log('Student not found for reg no:', studentRegNo)
      return
    }

    console.log(`📧 Sending application notification for student: ${student.first_name}`)
    
    // Call our notification API
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId,
        jobId,
        studentId: student.user_id
      })
    })

    if (!notificationResponse.ok) {
      console.error('Failed to send notification:', await notificationResponse.text())
    } else {
      const result = await notificationResponse.json()
      console.log('✅ Notification sent:', result)
    }
    
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    console.log(`Fetching applications for student ID: ${studentId}`)

    // Use the same query structure as admin API but filter by student
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('application_status')
      .select(`
        *,
        jobs!inner(*)
      `)
      .eq('student_reg_no', studentId)
      .order('applied_at', { ascending: false })

    console.log('Applications query result:', { applications: applications?.length || 0, error: appsError })

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json({ error: 'Failed to fetch applications', details: appsError }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalApplications: applications?.length || 0,
      activeApplications: applications?.filter((app: any) => !['placed', 'rejected'].includes(app.current_stage)).length || 0,
      interviews: applications?.filter((app: any) => ['interview', 'interview_scheduled', 'shortlisted'].includes(app.current_stage)).length || 0,
      offers: applications?.filter((app: any) => app.current_stage === 'offered').length || 0,
      placed: applications?.filter(app => app.current_stage === 'placed').length || 0
    }

    console.log('Applications stats:', stats)

    return NextResponse.json({
      success: true,
      data: applications || [],
      stats
    })

  } catch (error) {
    console.error('Error fetching student applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, job_id } = await request.json()

    if (!student_id || !job_id) {
      return NextResponse.json({ error: 'Student ID and Job ID are required' }, { status: 400 })
    }

    console.log(`Submitting application for student: ${student_id}, job: ${job_id}`)

    // Check if application already exists
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from('application_status')
      .select('*')
      .eq('student_reg_no', student_id) // Use student_reg_no field
      .eq('job_id', job_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing application:', checkError)
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 })
    }

    if (existingApp) {
      console.log('Application already exists')
      return NextResponse.json({ error: 'Application already submitted for this job' }, { status: 400 })
    }

    // Get job details for the application
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !jobData) {
      console.error('Job not found:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    console.log('Job data found:', jobData.title)

    // Create new application
    const { data: newApplication, error: insertError } = await supabaseAdmin
      .from('application_status')
      .insert({
        student_reg_no: student_id, // Use student_reg_no field
        job_id,
        company_name: jobData.company_name,
        current_stage: 'applied',
        applied_at: new Date().toISOString()
      })
      .select(`
        *,
        jobs!inner(*)
      `)
      .single()

    if (insertError) {
      console.error('Error creating application:', insertError)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    console.log('Application created successfully:', newApplication.id)

    // Log the activity
    const { error: activityError } = await supabaseAdmin
      .from('recent_activities')
      .insert({
        activity_type: 'application_submitted',
        description: `New application submitted for ${newApplication.jobs.title} at ${newApplication.jobs.company_name}`,
        details: {
          student_reg_no: student_id,
          job_id,
          company: newApplication.jobs.company_name,
          position: newApplication.jobs.title
        }
      })

    if (activityError) {
      console.error('Error logging activity:', activityError)
      // Don't fail the request if activity logging fails
    }

    // Send application confirmation notification
    sendApplicationNotification(newApplication.id, job_id, student_id)
      .catch(error => console.error('Notification error:', error))

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    })

  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}