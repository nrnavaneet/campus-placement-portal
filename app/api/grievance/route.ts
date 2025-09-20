import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentRegNo, studentName, issueType, message, contactEmail } = body

    // Validate required fields
    if (!studentRegNo || !studentName || !issueType || !message || !contactEmail) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Insert grievance into database
    const { data, error } = await supabase
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
        { error: "Failed to submit grievance" },
        { status: 500 }
      )
    }

    // TODO: Send notification email to admin and confirmation to student
    // This can be implemented using the notification service

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get("student_reg_no")

    let query = supabase.from("grievance_reports").select("*")

    // If student reg no provided, filter by it (for student dashboard)
    if (studentRegNo) {
      query = query.eq("student_reg_no", studentRegNo)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch grievances" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching grievances:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}