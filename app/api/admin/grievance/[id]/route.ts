import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const grievanceId = id
    const body = await request.json()
    const { status, admin_response } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ["submitted", "in_progress", "resolved"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (admin_response) {
      updateData.admin_response = admin_response
    }

    // Update grievance in database
    const { data, error } = await supabase
      .from("grievance_reports")
      .update(updateData)
      .eq("id", grievanceId)
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to update grievance" },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Grievance not found" },
        { status: 404 }
      )
    }

    const grievance = data[0]

    // Send notification email to student about status change
    if (status === "resolved" && admin_response) {
      try {
        console.log("Sending grievance resolution notification to:", grievance.contact_email)
        
        // Call notification service (would need to implement grievance notifications)
        // For now, just log that notification would be sent
        console.log("Grievance resolution notification would be sent")
        
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json(
      { message: "Grievance updated successfully", data: grievance },
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const grievanceId = id

    const { data, error } = await supabase
      .from("grievance_reports")
      .select("*")
      .eq("id", grievanceId)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to fetch grievance" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Grievance not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching grievance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const grievanceId = id

    const { error } = await supabase
      .from("grievance_reports")
      .delete()
      .eq("id", grievanceId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to delete grievance" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Grievance deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting grievance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}