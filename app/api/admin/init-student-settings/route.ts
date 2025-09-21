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

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing default settings for all students without settings...')

    // Get all students who don't have settings
    const { data: studentsWithoutSettings, error: studentsError } = await supabaseAdmin
      .from('student_details')
      .select('id, college_email')
      .not('id', 'in', `(
        SELECT student_id 
        FROM student_settings 
        WHERE student_id IS NOT NULL
      )`)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    if (!studentsWithoutSettings || studentsWithoutSettings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All students already have settings',
        count: 0
      })
    }

    console.log(`Found ${studentsWithoutSettings.length} students without settings`)

    // Default settings
    const defaultSettings = {
      newOpportunities: true,
      placementCongratulations: true
    }

    // Create settings for all students
    const settingsToInsert = studentsWithoutSettings.map(student => ({
      student_id: student.id,
      settings: defaultSettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data: insertedSettings, error: insertError } = await supabaseAdmin
      .from('student_settings')
      .insert(settingsToInsert)
      .select('student_id')

    if (insertError) {
      console.error('Error creating default settings:', insertError)
      return NextResponse.json(
        { error: 'Failed to create default settings' },
        { status: 500 }
      )
    }

    console.log(`Successfully created default settings for ${insertedSettings?.length || 0} students`)

    return NextResponse.json({
      success: true,
      message: `Default settings created for ${insertedSettings?.length || 0} students`,
      count: insertedSettings?.length || 0
    })

  } catch (error) {
    console.error('Error initializing settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}