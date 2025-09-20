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

// GET /api/admin/job-rounds?job_id=xyz - Get rounds for a specific job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Fetch job rounds for the specific job
    const { data: rounds, error } = await supabaseAdmin
      .from('job_rounds')
      .select('*')
      .eq('job_id', jobId)
      .order('round_number')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job rounds' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rounds: rounds || []
    })

  } catch (error) {
    console.error('Error fetching job rounds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/job-rounds - Create/update job rounds for a job
export async function POST(request: NextRequest) {
  try {
    const { job_id, rounds } = await request.json()

    if (!job_id || !Array.isArray(rounds)) {
      return NextResponse.json(
        { error: 'Job ID and rounds array are required' },
        { status: 400 }
      )
    }

    // Delete existing rounds for this job first
    await supabaseAdmin
      .from('job_rounds')
      .delete()
      .eq('job_id', job_id)

    // Insert new rounds
    if (rounds.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('job_rounds')
        .insert(
          rounds.map((round: any, index: number) => ({
            job_id,
            round_number: index + 1,
            round_name: round.round_name,
            round_type: round.round_type || 'interview',
            description: round.description || '',
            is_required: round.is_required !== false // Default to true
          }))
        )

      if (insertError) {
        console.error('Database error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create job rounds' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job rounds updated successfully'
    })

  } catch (error) {
    console.error('Error updating job rounds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET round templates - useful for admins when setting up new jobs
export async function OPTIONS() {
  const defaultRounds = [
    {
      round_name: 'Resume Shortlisting',
      round_type: 'screening',
      description: 'Initial screening based on resume and eligibility criteria',
      is_required: true
    },
    {
      round_name: 'Online Assessment',
      round_type: 'assessment',
      description: 'Technical and aptitude assessment',
      is_required: false
    },
    {
      round_name: 'Group Discussion',
      round_type: 'interview',
      description: 'Group discussion to evaluate communication and leadership skills',
      is_required: false
    },
    {
      round_name: 'Technical Round 1',
      round_type: 'interview',
      description: 'Technical interview focusing on programming and problem-solving',
      is_required: false
    },
    {
      round_name: 'Technical Round 2',
      round_type: 'interview',
      description: 'Advanced technical interview and system design',
      is_required: false
    },
    {
      round_name: 'Managerial Round',
      round_type: 'interview',
      description: 'Interview with hiring manager focusing on experience and fit',
      is_required: false
    },
    {
      round_name: 'HR Round',
      round_type: 'final',
      description: 'Final interview with HR for culture fit and offer discussion',
      is_required: false
    }
  ]

  return NextResponse.json({
    success: true,
    templates: defaultRounds
  })
}