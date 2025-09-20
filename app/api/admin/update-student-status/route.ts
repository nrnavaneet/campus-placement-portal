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
    const { student_id, status, company, package_amount, notes } = await request.json()

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // First get the current student data
    const { data: currentStudent, error: fetchError } = await supabaseAdmin
      .from('student_details')
      .select('*')
      .eq('id', student_id)
      .single()

    if (fetchError || !currentStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update placement status based on the new status
    let updatedPlacementStatus = { ...currentStudent.placement_status }

    if (status === 'placed') {
      updatedPlacementStatus.accepted_offers = Math.max(1, updatedPlacementStatus.accepted_offers || 0)
      updatedPlacementStatus.max_ctc = Math.max(package_amount, updatedPlacementStatus.max_ctc || 0)
    } else if (status === 'interview') {
      updatedPlacementStatus.interviews_attended = (updatedPlacementStatus.interviews_attended || 0) + 1
    } else if (status === 'rejected') {
      updatedPlacementStatus.rejections = (updatedPlacementStatus.rejections || 0) + 1
    }

    // Update the student record
    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('student_details')
      .update({
        placement_status: updatedPlacementStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating student:', updateError)
      return NextResponse.json({ error: 'Failed to update student status' }, { status: 500 })
    }

    // Log the activity
    const activityDescription = company 
      ? `Student ${currentStudent.first_name} status updated to ${status} at ${company}${package_amount ? ` (₹${package_amount})` : ''}`
      : `Student ${currentStudent.first_name} status updated to ${status}`

    const { error: activityError } = await supabaseAdmin
      .from('recent_activities')
      .insert({
        activity_type: 'student_update',
        description: activityDescription,
        details: {
          student_id,
          student_name: currentStudent.first_name,
          previous_status: currentStudent.placement_status,
          new_status: status,
          company,
          package_amount,
          notes
        }
      })

    if (activityError) {
      console.error('Error logging activity:', activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Student status updated successfully',
      data: updatedStudent
    })

  } catch (error) {
    console.error('Error updating student status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}