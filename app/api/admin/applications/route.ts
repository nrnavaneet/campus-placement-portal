import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

// POST method to update application status
export async function POST(request: NextRequest) {
  try {
    const { application_id, current_stage, notes } = await request.json()

    if (!application_id || !current_stage) {
      return NextResponse.json(
        { error: 'Application ID and current stage are required' },
        { status: 400 }
      )
    }

    // Update application status
    const { data, error } = await supabaseAdmin
      .from('application_status')
      .update({
        current_stage,
        updated_at: new Date().toISOString(),
        // Add notes to stage history if provided
        stage_history: notes ? {
          stage: current_stage,
          timestamp: new Date().toISOString(),
          notes
        } : undefined
      })
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