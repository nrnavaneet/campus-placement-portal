import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// GET /api/admin/application-rounds?application_id=xyz - Get round status for a specific application
// GET /api/admin/application-rounds?job_id=xyz - Get all application rounds for a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('application_id')
    const jobId = searchParams.get('job_id')
    const studentRegNo = searchParams.get('student_reg_no')

    let query = supabaseAdmin
      .from('application_rounds')
      .select(`
        *,
        job_rounds:job_round_id (
          round_number,
          round_name,
          round_type,
          description,
          is_required
        ),
        application_status:application_id (
          student_reg_no,
          job_id,
          company_name,
          status
        )
      `)

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    } else if (jobId) {
      // Get all application rounds for a specific job
      query = query.eq('application_status.job_id', jobId)
    } else if (studentRegNo) {
      query = query.eq('student_reg_no', studentRegNo)
    } else {
      return NextResponse.json(
        { error: 'application_id, job_id, or student_reg_no is required' },
        { status: 400 }
      )
    }

    const { data: rounds, error } = await query.order('created_at')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch application rounds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rounds: rounds || []
    })

  } catch (error) {
    console.error('Error fetching application rounds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/application-rounds - Update application round status
export async function POST(request: NextRequest) {
  try {
    const { application_id, job_round_id, status, notes, feedback, score, scheduled_at } = await request.json()

    if (!application_id || !job_round_id || !status) {
      return NextResponse.json(
        { error: 'application_id, job_round_id, and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'passed', 'failed', 'scheduled', 'completed', 'no_show']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Get student reg no from application
    const { data: application, error: appError } = await supabaseAdmin
      .from('application_status')
      .select('student_reg_no, job_id, company_name')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Upsert application round
    const roundData = {
      application_id,
      job_round_id,
      student_reg_no: application.student_reg_no,
      status,
      notes: notes || null,
      feedback: feedback || null,
      score: score ? parseFloat(score) : null,
      scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

    const { error: upsertError } = await supabaseAdmin
      .from('application_rounds')
      .upsert(roundData, {
        onConflict: 'application_id,job_round_id'
      })

    if (upsertError) {
      console.error('Database error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update application round' },
        { status: 500 }
      )
    }

    // Send notification to student about status update
    try {
      const { data: roundInfo } = await supabaseAdmin
        .from('job_rounds')
        .select('round_name')
        .eq('id', job_round_id)
        .single()

      if (roundInfo) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: application.student_reg_no,
            type: 'round_status_update',
            message: `Your ${roundInfo.round_name} status has been updated to: ${status}`,
            subject: `Round Update: ${application.company_name}`,
            jobTitle: 'Job Application',
            companyName: application.company_name,
            status
          })
        })
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application round updated successfully'
    })

  } catch (error) {
    console.error('Error updating application round:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/application-rounds - Initialize rounds for a new application
export async function PUT(request: NextRequest) {
  try {
    const { application_id } = await request.json()

    if (!application_id) {
      return NextResponse.json(
        { error: 'application_id is required' },
        { status: 400 }
      )
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('application_status')
      .select('student_reg_no, job_id')
      .eq('id', application_id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get job rounds for this job
    const { data: jobRounds, error: roundsError } = await supabaseAdmin
      .from('job_rounds')
      .select('id')
      .eq('job_id', application.job_id)
      .order('round_number')

    if (roundsError) {
      console.error('Database error:', roundsError)
      return NextResponse.json(
        { error: 'Failed to fetch job rounds' },
        { status: 500 }
      )
    }

    if (!jobRounds || jobRounds.length === 0) {
      return NextResponse.json(
        { error: 'No rounds configured for this job' },
        { status: 400 }
      )
    }

    // Initialize application rounds for each job round
    const applicationRounds = jobRounds.map((round, index) => ({
      application_id,
      job_round_id: round.id,
      student_reg_no: application.student_reg_no,
      status: index === 0 ? 'in_progress' : 'pending', // First round starts as in_progress
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabaseAdmin
      .from('application_rounds')
      .insert(applicationRounds)

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to initialize application rounds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application rounds initialized successfully',
      rounds_created: applicationRounds.length
    })

  } catch (error) {
    console.error('Error initializing application rounds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}