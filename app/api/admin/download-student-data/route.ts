import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

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
    const company = searchParams.get('company') || 'all'

    const getBaseUrl = () => {
      const origin = request.headers.get('origin')
      if (origin) return origin.replace(/\/$/, '')

      const host = request.headers.get('host')
      if (host) {
        const protocol = host.includes('localhost') ? 'http' : 'https'
        return `${protocol}://${host}`
      }

      if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
      }

      throw new Error("Unable to determine base URL for resume downloads")
    }

    const baseUrl = getBaseUrl()

    // Get applications data for the specified company
    let query = supabaseAdmin
      .from('application_status')
      .select(`
        *,
        jobs!inner(
          id,
          title,
          company_name,
          package_min,
          package_max
        )
      `)

    if (company !== 'all') {
      query = query.eq('jobs.company_name', company)
    }

    const { data: applications, error: appsError } = await query

    if (appsError) {
      console.error('Error fetching applications:', appsError)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ error: 'No applications found' }, { status: 404 })
    }

    // Get unique student registration numbers
    const studentRegNos = [...new Set(applications.map(app => app.student_reg_no))]

    // Fetch student details
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('student_details')
      .select('*')
      .in('college_reg_no', studentRegNos)

    if (studentsError) {
      console.error('Error fetching student details:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 })
    }

    // Create a zip file
    const zip = new JSZip()

    // Create CSV data for student information with comprehensive fields
    const csvHeaders = [
      'Registration Number',
      'Name', 
      'College Email',
      'Personal Email',
      'Mobile',
      'Gender',
      'Date of Birth',
      'Branch',
      'Course',
      'UG Percentage',
      '10th Percentage',
      '12th Percentage',
      'Year of Graduation',
      'Current Location',
      'Active Backlogs',
      'PWD Status',
      'Resume Status',
      'Verification Status',
      'Placement Status',
      'Current Offers',
      'Accepted Offers',
      'Max CTC (₹L)',
      'Max Offers Allowed',
      'Job Title',
      'Company Name',
      'Application Status',
      'Current Stage',
      'Applied Date',
      'Last Updated',
      'Package Range (₹L)',
      'Created Date'
    ].join(',')

    const csvRows = applications.map(app => {
      const student = students?.find(s => s.college_reg_no === app.student_reg_no)
      const job = app.jobs
      return [
        app.student_reg_no,
        student?.first_name || 'N/A',
        student?.college_email || 'N/A',
        student?.personal_email || 'N/A', 
        student?.mobile_number || 'N/A',
        student?.gender || 'N/A',
        student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : 'N/A',
        student?.branch || 'N/A',
        student?.course || 'N/A',
        student?.ug_percentage || 'N/A',
        student?.tenth_percentage || 'N/A',
        student?.twelfth_percentage || 'N/A',
        student?.year_of_graduation || 'N/A',
        student?.current_location || 'N/A',
        student?.active_backlogs ? 'Yes' : 'No',
        student?.pwd ? 'Yes' : 'No',
        student?.resume_url ? 'Uploaded' : 'Not Uploaded',
        student?.verification_status || 'pending_verification',
        student?.placement_status ? 'Active' : 'Not Active',
        student?.placement_status?.offers?.length || 0,
        student?.placement_status?.accepted_offers || 0,
        student?.placement_status?.max_ctc ? (student.placement_status.max_ctc / 100000).toFixed(1) : '0',
        student?.placement_status?.max_offers_allowed || 0,
        job?.title || 'N/A',
        job?.company_name || 'N/A',
        app.current_stage || 'N/A',
        app.current_stage || 'N/A',
        app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN') : 'N/A',
        app.updated_at ? new Date(app.updated_at).toLocaleDateString('en-IN') : 'N/A',
        job ? `₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L` : 'N/A',
        student?.created_at ? new Date(student.created_at).toLocaleDateString('en-IN') : 'N/A'
      ].map(field => `"${field}"`).join(',')
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    zip.file(`student_data_${company}_${new Date().toISOString().split('T')[0]}.csv`, csvContent)

    // Download resumes and add to zip
    const resumeFolder = zip.folder('resumes')
    
    for (const student of students || []) {
      if (student.resume_url) {
        try {
          // Fetch resume from admin API
          const resumeResponse = await fetch(`${baseUrl}/api/admin/resume/download?regNo=${student.college_reg_no}`)
          
          if (resumeResponse.ok) {
            const resumeBlob = await resumeResponse.blob()
            const resumeBuffer = await resumeBlob.arrayBuffer()
            
            // Add resume to zip with student name and reg no
            const fileName = `${student.college_reg_no}_${student.first_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown'}.pdf`
            resumeFolder?.file(fileName, resumeBuffer)
          } else {
            console.log(`Failed to fetch resume for ${student.college_reg_no}`)
          }
        } catch (resumeError) {
          console.error(`Error fetching resume for ${student.college_reg_no}:`, resumeError)
        }
      }
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    // Return zip file
    const fileName = `${company}_student_data_with_resumes_${new Date().toISOString().split('T')[0]}.zip`
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Error generating student data package:', error)
    return NextResponse.json({ error: 'Failed to generate student data package' }, { status: 500 })
  }
}