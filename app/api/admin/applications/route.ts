import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendAdminApplicationStatusUpdate } from '@/lib/notification-service'

// Create admin client with service role key on server side
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    let query = supabaseAdmin
      .from('application_status')
      .select(`
        *,
        jobs!inner(*)
      `)
      .order('applied_at', { ascending: false })

    // If job_id is provided, filter by it
    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      applications: data 
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { application_id, current_stage, notes, package_amount } = await request.json()

    if (!application_id || !current_stage) {
      return NextResponse.json(
        { error: 'Application ID and current stage are required' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      current_stage,
      updated_at: new Date().toISOString(),
      // Add notes to stage history if provided
      stage_history: notes ? {
        stage: current_stage,
        timestamp: new Date().toISOString(),
        notes
      } : undefined
    }

    // Add package amount if status is placed
    if (current_stage === 'placed' && package_amount) {
      updateData.package_amount = package_amount * 100000 // Convert lakhs to rupees
    }

    // Update application status
    const { data, error } = await supabaseAdmin
      .from('application_status')
      .update(updateData)
      .eq('id', application_id)
      .select(`
        *,
        jobs!inner(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Send email notification to student about status update
    try {
      await sendAdminApplicationStatusUpdate({
        studentRegNo: data.student_reg_no,
        studentName: data.student_name || 'Student',
        jobTitle: data.jobs.title,
        companyName: data.jobs.company_name,
        applicationId: data.id,
        newStatus: current_stage,
        statusMessage: getStatusMessage(current_stage),
        notes: notes || ''
      })
    } catch (notificationError) {
      console.error('Failed to send email notification:', notificationError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: 'Application status updated successfully' 
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get status message
function getStatusMessage(status: string): string {
  const statusMessages: Record<string, string> = {
    'applied': 'Your application has been received and is being reviewed.',
    'screening': 'Your application is currently under screening.',
    'interview': 'You have been shortlisted for an interview!',
    'selected': 'Congratulations! You have been selected.',
    'rejected': 'Unfortunately, you were not selected for this position.',
    'on_hold': 'Your application is currently on hold.',
    'withdrawn': 'Your application has been withdrawn.'
  }
  return statusMessages[status] || 'Your application status has been updated.'
}