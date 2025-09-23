import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

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

export async function POST(request: NextRequest) {
  try {
    console.log('Grievance submission started...')
    const body = await request.json()
    console.log('Received data:', body)
    
    const { studentRegNo, studentName, issueType, message, contactEmail } = body

    // Validate required fields
    if (!studentRegNo || !studentName || !issueType || !message || !contactEmail) {
      console.log('Validation failed - missing fields')
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    console.log('Validation passed, inserting to database...')
    // Insert grievance into database
    const { data, error } = await supabaseAdmin
      .from("grievance_reports")
      .insert([
        {
          student_reg_no: studentRegNo,
          student_name: studentName,
          issue_type: issueType,
          message,
          contact_email: contactEmail,
          status: "submitted"
        }
      ])
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to submit grievance", details: error.message },
        { status: 500 }
      )
    }

    console.log('Grievance submitted successfully:', data)
    return NextResponse.json(
      { message: "Grievance submitted successfully", data },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting grievance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Grievance update started...')
    const body = await request.json()
    console.log('Received update data:', body)
    
    const { id, status, admin_response } = body

    // Validate required fields
    if (!id || !status) {
      console.log('Validation failed - missing id or status')
      return NextResponse.json(
        { error: "Grievance ID and status are required" },
        { status: 400 }
      )
    }

    console.log('Validation passed, updating database...')
    // Update grievance in database
    const { data, error } = await supabaseAdmin
      .from("grievance_reports")
      .update({
        status,
        admin_response: admin_response || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update grievance", details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log('Grievance not found')
      return NextResponse.json(
        { error: "Grievance not found" },
        { status: 404 }
      )
    }

    console.log('Grievance updated successfully:', data)
    return NextResponse.json(
      { message: "Grievance updated successfully", data: data[0] },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating grievance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fast fetching grievances...')
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get("student_reg_no")

    let query = supabaseAdmin
      .from("grievance_reports")
      .select("id, student_reg_no, student_name, issue_type, message, contact_email, status, admin_response, created_at, updated_at")

    // If student reg no provided, filter by it (for student dashboard)
    if (studentRegNo) {
      query = query.eq("student_reg_no", studentRegNo)
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1000) // Prevent large data loads

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch grievances", success: false },
        { status: 500 }
      )
    }

    console.log(`Fetched ${data?.length || 0} grievances quickly`)
    
    // Add caching headers for better performance
    const response = NextResponse.json(data)
    response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=300') // 5min cache
    return response
    
  } catch (error) {
    console.error("Error fetching grievances:", error)
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    )
  }
}