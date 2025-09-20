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
    const email = searchParams.get('email')

    let query = supabaseAdmin
      .from('student_details')
      .select('*')

    if (studentId) {
      query = query.eq('id', studentId)
    } else if (email) {
      query = query.eq('college_email', email)
    } else {
      return NextResponse.json({ error: 'Student ID or email is required' }, { status: 400 })
    }

    const { data: student, error } = await query.single()

    if (error) {
      console.error('Error fetching student profile:', error)
      if (error.code === 'PGRST116') { // No rows found
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: student
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, ...updateData } = body

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Update student profile
    const { data: updatedStudent, error } = await supabaseAdmin
      .from('student_details')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedStudent
    })

  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}