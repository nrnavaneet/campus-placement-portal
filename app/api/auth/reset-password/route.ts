import { NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { supabaseAdmin } from "@/lib/supabase"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
})

const studentEmailRegex = /^22[a-zA-Z]+[0-9]+@msruas\.ac\.in$/

const getRedirectUrl = (request: Request) => {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL

  if (explicit) {
    return explicit.replace(/\/$/, "")
  }

  const headerOrigin = request.headers.get("origin")
  if (headerOrigin) {
    return headerOrigin.replace(/\/$/, "")
  }

  const url = new URL(request.url)
  if (url.origin) {
    return url.origin
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:3000"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    if (!studentEmailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please use your college email (e.g., 22etcs002132@msruas.ac.in)" },
        { status: 400 },
      )
    }

    const redirectBase = getRedirectUrl(request)
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/reset-password`,
    })

    if (error) {
      console.error("Supabase reset password error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to send reset email" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link sent successfully",
    })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      )
    }

    console.error("Forgot password API error:", error)
    return NextResponse.json(
      { error: "Something went wrong while sending the reset link" },
      { status: 500 },
    )
  }
}

