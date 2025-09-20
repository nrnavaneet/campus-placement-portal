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

// GET /api/student/application-rounds?student_id=xyz&application_id=abc - Get student's round progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const applicationId = searchParams.get('application_id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

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
          id,
          job_id,
          company_name,
          status as application_status,
          applied_at
        )
      `)
      .eq('student_reg_no', studentId)

    if (applicationId) {
      query = query.eq('application_id', applicationId)
    }

    const { data: rounds, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      
      // If the table doesn't exist, return empty data for demo mode
      if (error.code === '42P01') {
        console.log('Application rounds table not found, returning empty data')
        return NextResponse.json({
          success: true,
          applications: {}
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch application rounds' },
        { status: 500 }
      )
    }

    // Group rounds by application for better organization
    const roundsByApplication = rounds?.reduce((acc: any, round: any) => {
      const appId = round.application_id
      if (!acc[appId]) {
        acc[appId] = {
          application: round.application_status,
          rounds: []
        }
      }
      acc[appId].rounds.push({
        id: round.id,
        round_number: round.job_rounds?.round_number,
        round_name: round.job_rounds?.round_name,
        round_type: round.job_rounds?.round_type,
        description: round.job_rounds?.description,
        is_required: round.job_rounds?.is_required,
        status: round.status,
        notes: round.notes,
        scheduled_at: round.scheduled_at,
        completed_at: round.completed_at,
        feedback: round.feedback,
        score: round.score
      })
      return acc
    }, {}) || {}

    // Sort rounds within each application by round number
    Object.keys(roundsByApplication).forEach(appId => {
      roundsByApplication[appId].rounds.sort((a: any, b: any) => 
        (a.round_number || 0) - (b.round_number || 0)
      )
    })

    return NextResponse.json({
      success: true,
      applications: roundsByApplication
    })

  } catch (error) {
    console.error('Error fetching student application rounds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET application progress summary for dashboard
export async function POST(request: NextRequest) {
  try {
    const { student_id } = await request.json()

    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      )
    }

    // Get summary statistics for student dashboard
    const { data: roundsData, error } = await supabaseAdmin
      .from('application_rounds')
      .select(`
        status,
        application_status:application_id (
          company_name,
          status as application_status
        ),
        job_rounds:job_round_id (
          round_name,
          round_type
        )
      `)
      .eq('student_reg_no', student_id)

    if (error) {
      console.error('Database error:', error)
      
      // If the table doesn't exist, return empty stats for demo mode
      if (error.code === '42P01') {
        console.log('Application rounds table not found, returning empty stats')
        return NextResponse.json({
          success: true,
          stats: {
            total_applications: 0,
            rounds_pending: 0,
            rounds_in_progress: 0,
            rounds_completed: 0,
            rounds_failed: 0,
            interviews_scheduled: 0
          },
          recent_activity: []
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch rounds summary' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const stats = {
      total_applications: new Set(roundsData?.map((r: any) => r.application_id)).size || 0,
      rounds_pending: roundsData?.filter((r: any) => r.status === 'pending').length || 0,
      rounds_in_progress: roundsData?.filter((r: any) => r.status === 'in_progress').length || 0,
      rounds_completed: roundsData?.filter((r: any) => r.status === 'passed').length || 0,
      rounds_failed: roundsData?.filter((r: any) => r.status === 'failed').length || 0,
      interviews_scheduled: roundsData?.filter((r: any) => r.status === 'scheduled').length || 0
    }

    // Get recent activity
    const recentRounds = roundsData
      ?.filter((r: any) => r.status !== 'pending')
      .slice(0, 5)
      .map((r: any) => ({
        company: r.application_status?.company_name,
        round: r.job_rounds?.round_name,
        status: r.status,
        type: r.job_rounds?.round_type
      })) || []

    return NextResponse.json({
      success: true,
      stats,
      recent_activity: recentRounds
    })

  } catch (error) {
    console.error('Error fetching rounds summary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}