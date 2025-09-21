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

export async function POST(request: NextRequest) {
  try {
    const registrationData = await request.json()
    
    // Validate required fields
    if (!registrationData.first_name || !registrationData.personal_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert registration using service role key (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('student_details')
      .insert(registrationData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Add activity tracking for user registration
    await addActivity(`New student "${data.first_name}" registered`, 'user_registered', `Branch: ${data.branch}`)

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}