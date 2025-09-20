import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Get applications for the student
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('application_status')
      .select(`
        *,
        jobs!inner(*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      // If application_status table doesn't exist, return empty array
      if (appsError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          stats: {
            totalApplications: 0,
            activeApplications: 0,
            interviews: 0,
            offers: 0,
            placed: 0
          }
        })
      }
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalApplications: applications?.length || 0,
      activeApplications: applications?.filter(app => ['applied', 'under_review'].includes(app.status)).length || 0,
      interviews: applications?.filter(app => app.status === 'interview').length || 0,
      offers: applications?.filter(app => app.status === 'offered').length || 0,
      placed: applications?.filter(app => app.status === 'placed').length || 0
    }

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

    // Check if application already exists
    const { data: existingApp, error: checkError } = await supabaseAdmin
      .from('application_status')
      .select('*')
      .eq('student_id', student_id)
      .eq('job_id', job_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing application:', checkError)
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 })
    }

    if (existingApp) {
      return NextResponse.json({ error: 'Application already submitted for this job' }, { status: 400 })
    }

    // Create new application
    const { data: newApplication, error: insertError } = await supabaseAdmin
      .from('application_status')
      .insert({
        student_id,
        job_id,
        status: 'applied',
        applied_date: new Date().toISOString()
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

    // Log the activity
    const { error: activityError } = await supabaseAdmin
      .from('recent_activities')
      .insert({
        activity_type: 'application_submitted',
        description: `New application submitted for ${newApplication.jobs.title} at ${newApplication.jobs.company_name}`,
        details: {
          student_id,
          job_id,
          company: newApplication.jobs.company_name,
          position: newApplication.jobs.title
        }
      })

    if (activityError) {
      console.error('Error logging activity:', activityError)
      // Don't fail the request if activity logging fails
    }

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