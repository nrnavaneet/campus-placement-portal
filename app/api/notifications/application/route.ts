import { NextResponse } from 'next/server'
import { sendApplicationNotification } from '@/lib/notification-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { applicationId, jobId, studentId } = body

    if (!applicationId || !jobId || !studentId) {
      return NextResponse.json({ 
        error: 'Missing required fields: applicationId, jobId, studentId' 
      }, { status: 400 })
    }

    console.log('Sending application notification for:', {
      applicationId,
      jobId,
      studentId
    })

    const result = await sendApplicationNotification({
      applicationId,
      jobId,
      studentId
    })

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      smsSent: result.smsSent,
      message: 'Notification process completed'
    })

  } catch (error: any) {
    console.error('Failed to send notification:', error)
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error.message
    }, { status: 500 })
  }
}