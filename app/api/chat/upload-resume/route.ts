import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import PDFParse from 'pdf-parse'
import { storeResume, getResume, hasResume } from '@/lib/resume-storage'

// Re-export for use in chat route
export { getResume } from '@/lib/resume-storage'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

// Split resume text into chunks for better retrieval
function splitIntoChunks(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.substring(start, end))
    start = end - overlap
  }
  
  return chunks
}

// Create embeddings for resume chunks
async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  
  return response.data.map(item => item.embedding)
}

// Extract text from PDF buffer
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await PDFParse(buffer)
    return data.text || ''
  } catch (error) {
    throw new Error('Failed to parse PDF: ' + (error as Error).message)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('resume') as File
    const userId = formData.get('userId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Extract text from PDF
    console.log('📄 Starting PDF text extraction for userId:', userId)
    const resumeText = await extractTextFromPDF(buffer)
    
    console.log('✅ Text extracted:', {
      textLength: resumeText.length,
      preview: resumeText.substring(0, 200) + '...'
    })
    
    if (!resumeText || resumeText.trim().length < 50) {
      console.error('❌ Insufficient text extracted from PDF')
      return NextResponse.json({ error: 'Could not extract sufficient text from PDF. Please ensure the PDF contains text.' }, { status: 400 })
    }
    
    // Split into chunks
    const chunks = splitIntoChunks(resumeText)
    console.log('📦 Split into chunks:', chunks.length)
    
    // Create embeddings
    console.log('🧮 Creating embeddings...')
    const embeddings = await createEmbeddings(chunks)
    console.log('✅ Embeddings created:', embeddings.length)
    
    // Store in memory (in production, save to Supabase)
    storeResume(userId, {
      resumeText,
      chunks,
      embeddings,
      uploadedAt: new Date()
    })
    
    // Verify storage
    const stored = getResume(userId)
    console.log('💾 Resume stored successfully:', {
      stored: !!stored,
      storedTextLength: stored?.resumeText?.length || 0,
      storedChunksCount: stored?.chunks?.length || 0
    })
    
    return NextResponse.json({
      success: true,
      message: 'Resume processed successfully',
      chunksCount: chunks.length,
      textLength: resumeText.length,
      preview: resumeText.substring(0, 300) // Include preview to verify extraction
    })
  } catch (error: any) {
    console.error('Error processing resume:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process resume' },
      { status: 500 }
    )
  }
}

// Get resume data for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const resumeData = getResume(userId)
    
    if (!resumeData) {
      return NextResponse.json({ error: 'No resume found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      hasResume: true,
      chunksCount: resumeData.chunks.length,
      uploadedAt: resumeData.uploadedAt
    })
  } catch (error: any) {
    console.error('Error getting resume:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get resume' },
      { status: 500 }
    )
  }
}

