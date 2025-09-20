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

// Helper function to add activity
async function addActivity(title: string, type: string, description: string = '') {
  try {
    await supabaseAdmin.from('recent_activities').insert({
      title,
      type,
      description,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to add activity:', error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id
    const jobData = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!jobData.title || !jobData.company_name || !jobData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update job using service role key (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update(jobData)
      .eq('id', jobId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Add activity tracking for job update
    await addActivity(`Job "${data.title}" updated`, 'job_updated', `Job at ${data.company_name}`)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job title before deletion for activity tracking
    const { data: jobToDelete } = await supabaseAdmin
      .from('jobs')
      .select('title, company_name')
      .eq('id', jobId)
      .single()

    // Delete job using service role key
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Add activity tracking for job deletion
    if (jobToDelete) {
      await addActivity(`Job "${jobToDelete.title}" deleted`, 'job_deleted', `Job at ${jobToDelete.company_name}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}