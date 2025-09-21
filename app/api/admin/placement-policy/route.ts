import { NextRequest, NextResponse } from "next/server"

// Mock placement policy data - in production this would come from database
const MOCK_PLACEMENT_POLICY = {
  id: "1",
  max_offers_allowed: 3,
  second_offer_multiplier: 2.0,
  policy_description: "Students can have maximum 3 offers. For second offer onwards, minimum package should be 2x of previous offer.",
  effective_from: "2024-01-01",
  created_at: new Date().toISOString()
}

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from the placement_policy table
    // For now, return mock data
    return NextResponse.json({
      data: [MOCK_PLACEMENT_POLICY]
    })
  } catch (error) {
    console.error('Error fetching placement policy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch placement policy' },
      { status: 500 }
    )
  }
}