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
    const getCompanies = searchParams.get('get_companies') === 'true'

    // If requesting list of companies that have applications or jobs
    if (getCompanies) {
      // Get all companies from jobs table (regardless of applications)
      const { data: allJobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('company_name')

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError)
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
      }

      // Extract unique company names from all jobs
      const uniqueCompanies = Array.from(
        new Set(allJobs?.map((job: any) => job.company_name) || [])
      ).sort()

      return NextResponse.json({
        success: true,
        companies: uniqueCompanies
      })
    }

    // Get all jobs (regardless of application deadline or status)
    let jobsQuery = supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        company_name,
        package_min,
        package_max,
        status,
        application_deadline
      `)

    // Filter by company if specified
    if (company !== 'all') {
      jobsQuery = jobsQuery.eq('company_name', company)
    }

    const { data: allJobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get applications for these jobs
    let applicationsQuery = supabaseAdmin
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

    // Filter by company if specified
    if (company !== 'all') {
      applicationsQuery = applicationsQuery.eq('jobs.company_name', company)
    }

    const { data: applications, error: applicationsError } = await applicationsQuery

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    // Create report data - include all jobs, with or without applications
    const reportData: any[] = []
    
    // Get student details if there are applications
    let studentDetailsMap: any = {}
    if (applications && applications.length > 0) {
      const studentRegNos = applications.map(app => app.student_reg_no)
      const { data: studentDetails, error: studentsError } = await supabaseAdmin
        .from('student_details')
        .select(`
          college_reg_no,
          first_name,
          college_email,
          personal_email,
          mobile_number,
          branch,
          ug_percentage,
          active_backlogs,
          date_of_birth,
          gender
        `)
        .in('college_reg_no', studentRegNos)

      if (studentsError) {
        console.error('Error fetching student details:', studentsError)
        return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 })
      }

      // Create a map of student details for easy lookup
      studentDetailsMap = (studentDetails || []).reduce((acc: any, student: any) => {
        acc[student.college_reg_no] = student
        return acc
      }, {})
    }

    // Process jobs with applications
    if (applications && applications.length > 0) {
      const applicationsData = applications.map((app: any) => {
        const student = studentDetailsMap[app.student_reg_no]
        return {
          company_name: app.jobs.company_name,
          job_title: app.jobs.title,
          student_name: student ? student.first_name : 'Unknown',
          student_reg_no: app.student_reg_no,
          branch: student ? student.branch : 'Unknown',
          status: app.current_stage,
          package: app.package_amount ? `₹${(app.package_amount / 100000).toFixed(1)}L` : 
                   (app.jobs.package_min && app.jobs.package_max 
                    ? `₹${(app.jobs.package_min / 100000).toFixed(1)}L - ₹${(app.jobs.package_max / 100000).toFixed(1)}L`
                    : 'N/A'),
          email: student ? (student.college_email || student.personal_email) : 'Unknown',
          mobile: student ? student.mobile_number : 'Unknown',
          ug_percentage: student ? student.ug_percentage : 'Unknown',
          active_backlogs: student ? student.active_backlogs : 'Unknown',
          gender: student ? student.gender : 'Unknown',
          job_id: app.job_id,
          application_date: app.created_at
        }
      })
      reportData.push(...applicationsData)
    }

    // Process jobs without applications
    const jobsWithApplications = new Set((applications || []).map(app => app.job_id))
    const jobsWithoutApplications = (allJobs || []).filter(job => !jobsWithApplications.has(job.id))
    
    const jobsWithoutAppsData = jobsWithoutApplications.map((job: any) => ({
      company_name: job.company_name,
      job_title: job.title,
      student_name: 'No Applications',
      student_reg_no: 'N/A',
      branch: 'N/A',
      status: 'No Applications',
      package: job.package_min && job.package_max 
        ? `₹${(job.package_min / 100000).toFixed(1)}L - ₹${(job.package_max / 100000).toFixed(1)}L`
        : 'N/A',
      email: 'N/A',
      mobile: 'N/A',
      ug_percentage: 'N/A',
      active_backlogs: 'N/A',
      gender: 'N/A',
      job_id: job.id,
      application_date: 'N/A',
      job_status: job.status,
      application_deadline: job.application_deadline
    }))
    
    reportData.push(...jobsWithoutAppsData)

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
        case 'selected':
          acc[item.company_name].placed_count++
          break
        case 'interview':
        case 'interview_scheduled':
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