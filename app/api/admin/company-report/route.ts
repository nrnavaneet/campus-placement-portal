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
    const company = searchParams.get('company') || 'all'

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get all students with placement status
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('student_details')
      .select('*')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Process the data to create company-wise report
    let reportData: any[] = []

    // For now, we'll create sample data based on existing jobs and students
    if (jobs && students) {
      jobs.forEach((job: any) => {
        // Get students who could have applied to this job based on branch eligibility
        const eligibleStudents = students.filter((student: any) => 
          job.branches_allowed && job.branches_allowed.includes(student.branch)
        )

        // Create sample applications for demonstration
        eligibleStudents.slice(0, 3).forEach((student: any, index: number) => {
          let status = 'applied'
          if (student.placement_status.accepted_offers > 0) {
            status = 'placed'
          } else if (index === 0) {
            status = 'interview'
          } else if (index === 1) {
            status = 'rejected'
          }

          reportData.push({
            company_name: job.company_name,
            job_title: job.title,
            student_name: student.first_name,
            student_reg_no: student.college_reg_no,
            branch: student.branch,
            status: status,
            package: status === 'placed' ? (student.placement_status.max_ctc || job.package_max) : null,
            application_date: job.created_at
          })
        })
      })
    }

    // Filter by company if specified
    if (company !== 'all') {
      reportData = reportData.filter(item => 
        item.company_name.toLowerCase().includes(company.toLowerCase())
      )
    }

    // Sort by company name and then by student name
    reportData.sort((a, b) => {
      if (a.company_name !== b.company_name) {
        return a.company_name.localeCompare(b.company_name)
      }
      return a.student_name.localeCompare(b.student_name)
    })

    // Group by company for summary
    const companySummary = reportData.reduce((acc: any, item: any) => {
      if (!acc[item.company_name]) {
        acc[item.company_name] = {
          company_name: item.company_name,
          total_applications: 0,
          placed_count: 0,
          interview_count: 0,
          rejected_count: 0,
          pending_count: 0
        }
      }
      
      acc[item.company_name].total_applications++
      
      switch (item.status) {
        case 'placed':
          acc[item.company_name].placed_count++
          break
        case 'interview':
          acc[item.company_name].interview_count++
          break
        case 'rejected':
          acc[item.company_name].rejected_count++
          break
        default:
          acc[item.company_name].pending_count++
      }
      
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: reportData,
      summary: Object.values(companySummary),
      total_records: reportData.length
    })

  } catch (error) {
    console.error('Error generating company report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}