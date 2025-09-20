import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const regNo = searchParams.get('regNo')

    if (!studentId && !regNo) {
      return NextResponse.json({ error: 'Student ID or registration number is required' }, { status: 400 })
    }

    // Get student data to find resume path
    let query = supabaseAdmin
      .from('student_details')
      .select('college_reg_no, resume_url, first_name')

    if (studentId) {
      query = query.eq('id', studentId)
    } else if (regNo) {
      query = query.eq('college_reg_no', regNo)
    }

    const { data: student, error: studentError } = await query.single()

    if (studentError) {
      console.error('Error fetching student:', studentError)
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.resume_url) {
      return NextResponse.json({ error: 'No resume uploaded. Please upload your resume first.' }, { status: 404 })
    }

    // Extract the file path from the resume URL
    let filePath = student.resume_url
    
    // Handle different URL formats
    if (filePath.includes('/storage/v1/object/public/placements/')) {
      // Full Supabase public URL
      const urlParts = filePath.split('/storage/v1/object/public/placements/')
      filePath = urlParts[1]
    } else if (filePath.includes('/placements/')) {
      // Relative path with bucket name
      const urlParts = filePath.split('/placements/')
      filePath = urlParts[1]
    } else if (filePath.startsWith('placements/')) {
      // Path already includes bucket name
      filePath = filePath.substring(11) // Remove 'placements/'
    } else if (filePath.startsWith('/')) {
      // Remove leading slash
      filePath = filePath.substring(1)
    }

    // Ensure we have a valid file path
    if (!filePath || filePath.startsWith('/mock-storage/')) {
      return NextResponse.json({ error: 'No valid resume uploaded. Please upload your resume first.' }, { status: 404 })
    }

    console.log('Attempting to download file:', filePath)

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('placements')
      .download(filePath)

    if (downloadError) {
      console.error('Error downloading resume:', downloadError)
      if (downloadError.message.includes('Object not found')) {
        return NextResponse.json({ error: 'Resume file not found. Please upload your resume first.' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to download resume' }, { status: 500 })
    }

    if (!fileData || fileData.size === 0) {
      return NextResponse.json({ error: 'Resume file is empty. Please upload your resume again.' }, { status: 404 })
    }

    // Convert blob to array buffer
    const buffer = await fileData.arrayBuffer()

    // Return the file with appropriate headers
    const fileName = `${student.college_reg_no}_Resume.pdf`
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}