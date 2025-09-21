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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const email = searchParams.get('email')

    if (!studentId && !email) {
      return NextResponse.json(
        { error: 'Student ID or email is required' },
        { status: 400 }
      )
    }

    // Get student settings
    let query = supabaseAdmin
      .from('student_settings')
      .select('*')
    
    if (studentId) {
      query = query.eq('student_id', studentId)
    } else {
      // First get student ID from email
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('student_details')
        .select('id')
        .eq('college_email', email)
        .single()
      
      if (studentError || !studentData) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      
      query = query.eq('student_id', studentData.id)
    }

    const { data, error } = await query.single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Default settings - only the two settings needed
    const defaultDbSettings = {
      newOpportunities: true,
      placementCongratulations: true
    }

    const defaultFrontendSettings = {
      newOpportunities: true,
      placementCongratulations: true,
    }

    // If no settings found, create default settings for the user
    if (!data || error?.code === 'PGRST116') {
      // Get the student ID if we only have email
      let currentStudentId = studentId
      if (!currentStudentId && email) {
        const { data: studentData } = await supabaseAdmin
          .from('student_details')
          .select('id')
          .eq('college_email', email)
          .single()
        currentStudentId = studentData?.id
      }

      if (currentStudentId) {
        // Create default settings in database
        const { data: newSettings, error: createError } = await supabaseAdmin
          .from('student_settings')
          .upsert({
            student_id: currentStudentId,
            settings: defaultDbSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'student_id'
          })
          .select()
          .single()

        if (!createError && newSettings) {
          // Return the newly created settings in frontend format
          return NextResponse.json({
            success: true,
            data: {
              newOpportunities: newSettings.settings.newOpportunities,
              placementCongratulations: newSettings.settings.placementCongratulations
            }
          })
        }
      }
      
      // If we can't create settings, return defaults
      return NextResponse.json({
        success: true,
        data: defaultFrontendSettings
      })
    }

    // Map existing database settings to frontend format
    const frontendSettings = {
      newOpportunities: data.settings.newOpportunities !== undefined ? data.settings.newOpportunities : true,
      placementCongratulations: data.settings.placementCongratulations !== undefined ? data.settings.placementCongratulations : true,
    }

    return NextResponse.json({
      success: true,
      data: frontendSettings
    })
  } catch (err) {
    console.error('Settings API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, email, settings } = await request.json()

    if (!student_id && !email) {
      return NextResponse.json(
        { error: 'Student ID or email is required' },
        { status: 400 }
      )
    }

    let studentId = student_id

    // If email provided instead of student_id, get student_id
    if (!studentId && email) {
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('student_details')
        .select('id')
        .eq('college_email', email)
        .single()
      
      if (studentError || !studentData) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      
      studentId = studentData.id
    }

    // Use simple settings structure - just store what frontend sends
    const dbSettings = {
      newOpportunities: settings.newOpportunities !== undefined ? settings.newOpportunities : true,
      placementCongratulations: settings.placementCongratulations !== undefined ? settings.placementCongratulations : true
    }

    // Upsert settings
    const { data, error } = await supabaseAdmin
      .from('student_settings')
      .upsert({
        student_id: studentId,
        settings: dbSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Settings save error:', error)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        newOpportunities: dbSettings.newOpportunities,
        placementCongratulations: dbSettings.placementCongratulations
      }
    })
  } catch (err) {
    console.error('Settings API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}