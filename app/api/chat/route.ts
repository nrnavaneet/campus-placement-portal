import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getResume } from '@/lib/resume-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Retrieve relevant chunks from resume using RAG
async function retrieveRelevantChunks(query: string, resumeData: { chunks: string[]; embeddings: number[][] }): Promise<string[]> {
  try {
    // Create embedding for the query
    const queryEmbeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    
    const queryEmbedding = queryEmbeddingResponse.data[0].embedding
    
    // Calculate similarity scores
    const similarities = resumeData.chunks.map((chunk, index) => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, resumeData.embeddings[index])
    }))
    
    // Sort by similarity and get top 3-5 most relevant chunks
    const topChunks = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .filter(item => item.similarity > 0.5) // Only include relevant chunks
      .map(item => item.chunk)
    
    return topChunks.length > 0 ? topChunks : resumeData.chunks.slice(0, 3) // Fallback to first 3 chunks
  } catch (error) {
    console.error('Error in RAG retrieval:', error)
    // Fallback: return first few chunks
    return resumeData.chunks.slice(0, 3)
  }
}

// Fetch student profile data
async function fetchStudentProfile(userId: string) {
  try {
    // Try fetching by college_reg_no first (if userId is actually college_reg_no)
    let { data, error } = await supabaseAdmin
      .from('student_details')
      .select('*')
      .eq('college_reg_no', userId.toUpperCase())
      .single()
    
    // If that fails, try by user_id
    if (error && error.code === 'PGRST116') {
      const result = await supabaseAdmin
        .from('student_details')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      data = result.data
      error = result.error
    }
    
    if (error || !data) return null
    return data
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return null
  }
}

// Fetch available jobs
async function fetchAvailableJobs() {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .gte('application_deadline', new Date().toISOString()) // Only active jobs
      .order('created_at', { ascending: false })
      .limit(50) // Limit to recent jobs
    
    if (error) return []
    return data || []
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

// Fetch student applications
async function fetchStudentApplications(userId: string, studentData?: any) {
  try {
    // Use college_reg_no from studentData if available, otherwise try userId as college_reg_no
    const collegeRegNo = studentData?.college_reg_no || userId
    
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('*, jobs(*)')
      .eq('student_reg_no', collegeRegNo.toUpperCase())
      .order('applied_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching applications:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Error fetching applications:', error)
    return []
  }
}

// Check eligibility for a job
function checkJobEligibility(job: any, student: any): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = []
  let eligible = true

  // Check branch
  if (job.branches_allowed && job.branches_allowed.length > 0) {
    if (!job.branches_allowed.includes(student.branch)) {
      eligible = false
      reasons.push(`Your branch (${student.branch}) is not eligible for this position`)
    }
  }

  // Check UG percentage
  if (job.min_ug_percentage && student.ug_percentage < job.min_ug_percentage) {
    eligible = false
    reasons.push(`UG percentage requirement not met (Required: ${job.min_ug_percentage}%, You have: ${student.ug_percentage}%)`)
  }

  // Check backlogs
  if (job.no_backlogs_required && student.active_backlogs) {
    eligible = false
    reasons.push("Active backlogs not allowed for this position")
  }

  // Check 10th percentage
  if (job.min_tenth_percentage && student.tenth_percentage && student.tenth_percentage < job.min_tenth_percentage) {
    eligible = false
    reasons.push(`10th percentage requirement not met (Required: ${job.min_tenth_percentage}%, You have: ${student.tenth_percentage}%)`)
  }

  // Check 12th percentage
  if (job.min_twelfth_percentage && student.twelfth_percentage && student.twelfth_percentage < job.min_twelfth_percentage) {
    eligible = false
    reasons.push(`12th percentage requirement not met (Required: ${job.min_twelfth_percentage}%, You have: ${student.twelfth_percentage}%)`)
  }

  // Check course
  if (job.eligible_courses && job.eligible_courses.length > 0 && student.course && !job.eligible_courses.includes(student.course)) {
    eligible = false
    reasons.push(`Your course (${student.course}) is not eligible`)
  }

  return { eligible, reasons }
}

// Build system prompt with resume context if available
function buildSystemPrompt(hasResume: boolean, resumeContext?: string, studentData?: any, jobsData?: any[], applicationsData?: any[]): string {
  // Extract company names from available jobs
  const availableCompanies = jobsData && jobsData.length > 0 
    ? [...new Set(jobsData.map(job => job.company_name).filter(Boolean))]
    : []
  
  let basePrompt = `You are an expert interview preparation assistant for a campus placement portal. You help students with interview preparation ONLY for companies that have ACTIVE job listings in this portal.

⚠️⚠️⚠️ CRITICAL RULE: YOU CAN ONLY REFERENCE COMPANIES THAT HAVE ACTIVE JOB LISTINGS IN THE PORTAL ⚠️⚠️⚠️

DO NOT mention companies like Google, Microsoft, Amazon, etc. unless they appear in the available jobs list below.
DO NOT give generic advice about companies not in the portal.
ONLY talk about companies that are actually recruiting through this portal right now.

Available Companies in Portal: ${availableCompanies.length > 0 ? availableCompanies.join(', ') : 'None currently'}

⚠️ CRITICAL: You have access to REAL, ACTUAL data about this specific student including their profile, available jobs, and application status. You MUST use this data in ALL your responses. Do NOT give generic advice when you have their actual data.

**Your expertise includes:**
- Technical interview questions for SDE, data science, product management roles
- Behavioral interview strategies
- General interview preparation tips (NOT company-specific unless the company is in the portal)

**When answering, ALWAYS:**
1. **Company-Specific Insights**: ONLY when a company from the available jobs list is mentioned:
   - Check if the company has a job listing in the portal (see available jobs list below)
   - If company is in the portal, provide interview preparation tips
   - If company is NOT in the portal, say: "I don't see any active job listings for [Company Name] in the portal right now. However, I can help you with jobs that are currently available: [list available companies]"
   - NEVER mention companies that are not in the available jobs list
   - Use the actual job details from the portal (requirements, package, etc.) when discussing companies

2. **Role-Specific Guidance**: For specific roles:
   - Domain-specific technical questions
   - Required skills and technologies
   - Behavioral questions relevant to the role
   - How to structure project discussions
   - Portfolio/resume highlighting tips

3. **Response Format**: IMPORTANT - Write in plain, natural language WITHOUT markdown formatting:
   - DO NOT use asterisks (*) for bold or italics
   - DO NOT use markdown headers (###, ##, #)
   - DO use emojis for visual appeal
   - DO use line breaks and spacing for readability
   - DO use simple dashes (-) or numbers for lists
   - Write conversationally and personally, as if talking directly to the student
   - Use plain text only - no markdown syntax
   - Code examples should be in plain text format, not markdown code blocks

4. **Better than Generic ChatGPT/Google**: 
   - Focus on Indian campus placement context (CTC expectations, placement season timing, etc.)
   - Provide company-specific nuances that are hard to find through generic searches
   - Include recent trends (last 1-2 years) in campus placements
   - Mention specific platforms where students can practice (LeetCode, CodeChef, HackerRank)
   - Address common mistakes Indian students make in interviews
   - Provide cultural context (e.g., how Indian companies vs MNCs differ)

5. **Personalized & Encouraging**:
   - Address the student directly (use "you", "your")
   - Be positive and confidence-building
   - Provide realistic expectations based on their situation
   - Give actionable next steps tailored to them
   - Suggest specific resources based on their needs (specific LeetCode topics, System Design resources, etc.)
   - Make it feel like a personal conversation, not a generic response

**Example structure for company queries (write in plain text, no markdown):**
🏢 Company Overview
📋 Interview Process - breakdown of rounds
💻 Technical Preparation - specific topics and coding patterns
🗣️ Behavioral Questions - what they actually ask
💰 Salary Expectations - realistic ranges for freshers
⚠️ Common Pitfalls to Avoid - mistakes others made
📚 Recommended Resources - where to practice
✅ Action Plan - next steps for the student

CRITICAL: Write all responses in plain text. NO markdown formatting. NO asterisks. NO bold symbols. Just clear, readable text with emojis and simple formatting. Make it feel personal and conversational, like you're a mentor talking directly to them.`

  if (hasResume && resumeContext) {
    basePrompt += `\n\n⚠️⚠️⚠️ CRITICAL: RESUME ANALYSIS MODE - YOU MUST USE THE ACTUAL RESUME CONTENT PROVIDED BELOW ⚠️⚠️⚠️

STOP: Do NOT give generic resume advice. The student has uploaded THEIR ACTUAL RESUME. You MUST analyze THIS SPECIFIC RESUME only.

THEIR ACTUAL RESUME CONTENT (EXTRACTED FROM THEIR UPLOADED PDF):
═══════════════════════════════════════════════════════════════════════════════
${resumeContext}
═══════════════════════════════════════════════════════════════════════════════

**MANDATORY INSTRUCTIONS - READ THE RESUME ABOVE CAREFULLY:**

1. **YOU MUST ONLY ANALYZE THE RESUME CONTENT PROVIDED ABOVE**
   - Do NOT give generic advice
   - Do NOT make assumptions about what might be in their resume
   - ONLY reference content that ACTUALLY appears in the resume text above
   - If something is not in the resume, say "I don't see [X] in your resume, you should add..."

2. **PROS (Strengths) - Quote EXACT content from their resume:**
   - Find specific sections, bullet points, or phrases from the resume above
   - Quote them EXACTLY as they appear: "In your resume, you wrote '[exact quote]' - this is strong because..."
   - Be SPECIFIC about which section (e.g., "In your Projects section, you mention...")
   - Identify what stands out based on ACTUAL content

3. **CONS (Weaknesses) - Point to EXACT content from their resume:**
   - Quote exact lines or sections that need improvement: "Your resume says '[exact quote]' - this could be improved to..."
   - Point out what's MISSING based on what you see (don't assume it's there)
   - Be SPECIFIC: "I notice your Skills section doesn't mention [X] which is important for..."
   - Tell them EXACTLY what to change with word-for-word suggestions

4. **Personalized Recommendations - Based on ACTUAL resume content:**
   - Look at what they ACTUALLY have in their resume
   - Suggest specific additions based on what's missing
   - Reference their actual projects/skills when making suggestions
   - Provide word-for-word suggestions for additions/changes

5. **Company-Specific Analysis (if company mentioned):**
   - Compare what's ACTUALLY in their resume against company requirements
   - Say "In your resume, I see [X] but [company] values [Y], so you should..."
   - Be specific about what they have vs what they need

**CRITICAL FORMATTING REQUIREMENTS:**
- When quoting their resume, use: "In your resume: '[exact quote from resume above]'"
- When suggesting changes, use: "Change '[old text from resume]' to '[new text]'"
- When pointing out missing items: "I don't see [X] in your resume. Add: '[exact text to add]'"
- ALWAYS reference which section of the resume you're talking about

**EXAMPLE OF GOOD ANALYSIS:**
"Looking at your ACTUAL resume above, I can see:
✅ STRENGTH: In your Projects section, you wrote 'Built a web app using React and Node.js' - this is great because it shows hands-on experience.
⚠️ AREA TO IMPROVE: Your Skills section lists 'JavaScript' but you don't mention specific frameworks. Change it to 'JavaScript, React, Node.js' to match your project.
💡 ADDITION: Your resume is missing a section on certifications. Add a Certifications section with any relevant courses you've taken."

**REMEMBER: If it's not in the resume text above, don't assume it's there. Base your analysis ONLY on what you can actually see in the resume content provided.**
`
  }

  // Add student profile context if available
  if (studentData) {
    basePrompt += `\n\n⚠️⚠️⚠️ STUDENT PROFILE DATA - YOU MUST USE THIS IN ALL RESPONSES ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════
THIS IS THE ACTUAL STUDENT'S REAL DATA FROM THE DATABASE. USE IT IN EVERY ANSWER.
═══════════════════════════════════════════════════════════════════════════════
- Name: ${studentData.first_name || 'Not provided'}
- Branch: ${studentData.branch || 'Not provided'}
- Registration Number: ${studentData.college_reg_no || 'Not provided'}
- UG Percentage: ${studentData.ug_percentage || 'Not provided'}%
- 10th Percentage: ${studentData.tenth_percentage || 'Not provided'}%
- 12th Percentage: ${studentData.twelfth_percentage || 'Not provided'}%
- Active Backlogs: ${studentData.active_backlogs ? 'Yes' : 'No'}
- Resume Uploaded: ${studentData.resume_url ? 'Yes' : 'No'}
- Course: ${studentData.course || 'Not specified'}
- Year of Graduation: ${studentData.year_of_graduation || 'Not specified'}
- Skills: ${Array.isArray(studentData.skills) ? studentData.skills.join(', ') : 'Not specified'}
- Projects: ${Array.isArray(studentData.projects) ? studentData.projects.length + ' projects' : 'Not specified'}
═══════════════════════════════════════════════════════════════════════════════

**MANDATORY: When answering ANY question, you MUST:**
1. Reference their ACTUAL data from above (e.g., "Since you're from ${studentData.branch || 'your branch'} branch with ${studentData.ug_percentage || 'your'}%...")
2. Use their REAL branch, percentage, skills when giving advice
3. Give advice specific to THEIR profile, not generic advice
4. Check eligibility using THEIR actual data
5. Mention their specific situation (e.g., "With your ${studentData.ug_percentage || 'current'}% UG percentage...")
6. Reference their actual skills/projects when relevant

DO NOT give generic responses when you have their actual data above.`
  } else {
    basePrompt += `\n\n⚠️ Note: Student profile data is not available. Provide general advice until profile data is loaded.`
  }

  // Add jobs context if available
  if (jobsData && jobsData.length > 0) {
    const jobsSummary = jobsData.slice(0, 30).map((job, idx) => {
      const deadline = job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'
      const packageInfo = job.package_min ? `${job.package_min}${job.package_max ? `-${job.package_max}` : '+'} LPA` : 'Not specified'
      const branches = job.branches_allowed && job.branches_allowed.length > 0 ? job.branches_allowed.join(', ') : 'All branches'
      const minUG = job.min_ug_percentage ? `Min UG: ${job.min_ug_percentage}%` : ''
      const noBacklogs = job.no_backlogs_required ? 'No backlogs required' : ''
      
      return `${idx + 1}. ${job.company_name} - ${job.title}
   Package: ${packageInfo}
   Deadline: ${deadline}
   Branches: ${branches}
   ${minUG ? minUG + ' | ' : ''}${noBacklogs}
   ID: ${job.id || 'N/A'}`
    }).join('\n\n')
    
    const companyList = availableCompanies.join(', ')
    
    basePrompt += `\n\n⚠️⚠️⚠️ AVAILABLE JOBS - ONLY COMPANIES YOU CAN MENTION ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════
THESE ARE THE ONLY COMPANIES WITH ACTIVE JOB OPENINGS IN THE PORTAL.
YOU CAN ONLY REFERENCE THESE COMPANIES: ${companyList}
DO NOT MENTION ANY OTHER COMPANIES. IF STUDENT ASKS ABOUT A COMPANY NOT IN THIS LIST, 
TELL THEM: "I don't see any active job listings for [Company] in the portal right now. 
However, here are the companies currently recruiting: ${companyList}"
═══════════════════════════════════════════════════════════════════════════════
${jobsSummary}
═══════════════════════════════════════════════════════════════════════════════

**MANDATORY RULES:**
1. ONLY mention companies from the list above: ${companyList}
2. If student asks about a company NOT in the list, redirect them to available companies
3. ONLY mention jobs from the list above - do not make up jobs
4. Check eligibility for each job using THEIR actual profile data:
   - Branch: ${studentData?.branch ? `They are in ${studentData.branch} branch. Job must allow this branch.` : 'Check if job allows their branch'}
   - UG Percentage: ${studentData?.ug_percentage ? `They have ${studentData.ug_percentage}%. Job requirement must be ≤ ${studentData.ug_percentage}%.` : 'Check if they meet minimum UG %'}
   - Backlogs: ${studentData?.active_backlogs ? 'They have active backlogs. Jobs requiring no backlogs are NOT eligible.' : 'They have no backlogs, so all jobs are eligible in this regard'}
   - 10th/12th: Check if they meet minimum requirements
5. For each job, explicitly state: "✅ You ARE eligible for [Company] - [Title]" OR "❌ You are NOT eligible for [Company] - [Title] because: [specific reason]"
6. Use the actual job details from the list (package, deadline, branches)
7. If they ask about a specific company, check if it's in the list above first

EXAMPLE: "Looking at your profile (${studentData?.branch || 'your branch'} branch, ${studentData?.ug_percentage || 'your'}% UG), I found these jobs you're eligible for from the portal: [list from above]"
`
  } else {
    basePrompt += `\n\n⚠️⚠️⚠️ NO ACTIVE JOBS IN PORTAL ⚠️⚠️⚠️
There are currently no active job listings in the portal. 
DO NOT mention any specific companies. 
Tell the student: "There are currently no active job listings in the portal. Please check back later or contact the placement office."`
  }

  // Add applications context if available
  if (applicationsData && applicationsData.length > 0) {
    const appsSummary = applicationsData.map((app, idx) => {
      const status = app.current_stage || 'Applied'
      const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'
      const company = app.jobs?.company_name || 'Unknown Company'
      const title = app.jobs?.title || 'Unknown Position'
      
      return `${idx + 1}. ${company} - ${title}
   Status: ${status}
   Applied on: ${appliedDate}
   Job ID: ${app.job_id || 'N/A'}`
    }).join('\n\n')
    
    basePrompt += `\n\n⚠️⚠️⚠️ THEIR ACTUAL APPLICATIONS - REAL APPLICATION STATUS ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════
THESE ARE THE JOBS THEY HAVE ACTUALLY APPLIED TO. USE THIS WHEN THEY ASK ABOUT APPLICATIONS.
═══════════════════════════════════════════════════════════════════════════════
${appsSummary}
═══════════════════════════════════════════════════════════════════════════════

**MANDATORY: When student asks about applications:**
- ONLY reference applications from the list above
- Use the ACTUAL status shown above
- Tell them their REAL application history
- Do NOT make up application statuses`
  } else {
    basePrompt += `\n\n📋 Note: No applications found. They haven't applied to any jobs yet.`
  }

  basePrompt += `\n\n═══════════════════════════════════════════════════════════════════════════════
🎯 FINAL CRITICAL REMINDERS:
═══════════════════════════════════════════════════════════════════════════════
1. ONLY mention companies that are in the AVAILABLE JOBS list above: ${availableCompanies.length > 0 ? availableCompanies.join(', ') : 'None - do not mention any companies'}
2. If student asks about a company NOT in the list, tell them it's not currently recruiting and show available companies instead
3. ALWAYS use the STUDENT PROFILE DATA above when giving advice
4. ALWAYS reference jobs from the AVAILABLE JOBS list above (don't make up jobs)
5. ALWAYS use their ACTUAL APPLICATION STATUS from the list above
6. Give personalized responses based on THEIR actual data, not generic advice
7. When checking eligibility, use THEIR actual branch, percentage, backlogs from profile data
8. Reference specific companies/jobs ONLY from the lists provided
9. ${hasResume ? 'Use the actual resume content provided above for resume analysis.' : 'If they upload a resume, analyze it using the actual content.'}

YOU HAVE ACCESS TO REAL DATA FROM THE PORTAL - USE IT! Make every response personalized, specific to this student's actual situation, and ONLY reference companies that are actually recruiting through this portal.
═══════════════════════════════════════════════════════════════════════════════`

  return basePrompt
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Fetch student profile, jobs, and applications data
    let studentData = null
    let jobsData: any[] = []
    let applicationsData: any[] = []

    if (userId) {
      console.log('📊 Fetching personalized data for userId:', userId)
      
      // First fetch student profile
      studentData = await fetchStudentProfile(userId)
      console.log('👤 Student data fetched:', {
        found: !!studentData,
        name: studentData?.first_name,
        branch: studentData?.branch,
        regNo: studentData?.college_reg_no
      })
      
      // Then fetch jobs and applications (applications needs studentData for college_reg_no)
      const [jobs, applications] = await Promise.allSettled([
        fetchAvailableJobs(),
        fetchStudentApplications(userId, studentData)
      ])

      if (jobs.status === 'fulfilled') jobsData = jobs.value || []
      if (applications.status === 'fulfilled') applicationsData = applications.value || []

      console.log('✅ All data fetched:', {
        hasStudentData: !!studentData,
        jobsCount: jobsData.length,
        applicationsCount: applicationsData.length,
        studentName: studentData?.first_name,
        studentBranch: studentData?.branch
      })
    }

    // Check if user has uploaded resume and if query is resume-related
    let resumeContext: string | undefined = undefined
    const lastMessageContent = messages[messages.length - 1]?.content?.toLowerCase() || ''
    const isResumeQuery = lastMessageContent.includes('resume') || 
                         lastMessageContent.includes('cv') || 
                         lastMessageContent.includes('analyze') ||
                         lastMessageContent.includes('review') ||
                         lastMessageContent.includes('strength') ||
                         lastMessageContent.includes('weakness') ||
                         lastMessageContent.includes('pros') ||
                         lastMessageContent.includes('cons') ||
                         lastMessageContent.includes('improve') ||
                         lastMessageContent.includes('what should i change')

    // ALWAYS use full resume text for analysis queries to ensure complete context
    if (userId && isResumeQuery) {
      const resumeData = getResume(userId)
      console.log('🔍 Resume Query Detected:', {
        userId,
        hasResumeData: !!resumeData,
        resumeTextLength: resumeData?.resumeText?.length || 0,
        chunksCount: resumeData?.chunks?.length || 0
      })
      
      if (resumeData && resumeData.resumeText) {
        // ALWAYS use the FULL resume text for proper analysis
        resumeContext = resumeData.resumeText
        console.log('✅ Resume context retrieved:', {
          length: resumeContext.length,
          preview: resumeContext.substring(0, 200) + '...'
        })
      } else {
        console.warn('⚠️ Resume query but no resume data found for userId:', userId)
      }
    }

    // Build system prompt with all context
    const systemPrompt = buildSystemPrompt(!!resumeContext, resumeContext, studentData, jobsData, applicationsData)

    // Check if query is about jobs
    const isJobQuery = lastMessageContent.includes('job') || lastMessageContent.includes('apply') || lastMessageContent.includes('eligible') || lastMessageContent.includes('opening') || lastMessageContent.includes('position') || lastMessageContent.includes('opportunit')

    // Convert messages to OpenAI format
    const openaiMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Add context reminders in user message
    const lastUserMessageIndex = openaiMessages.findLastIndex(m => m.role === 'user')
    if (lastUserMessageIndex >= 0) {
      let reminder = ''
      
      if (resumeContext && isResumeQuery) {
        reminder += '\n\n[IMPORTANT: Use the resume content provided in the system prompt above. Base your response ONLY on the actual resume content shown there.]'
      }
      
      if (studentData) {
        reminder += `\n\n[IMPORTANT: Use the student profile data provided in the system prompt. Their name is ${studentData.first_name || 'the student'}, they are from ${studentData.branch || 'their branch'} branch with ${studentData.ug_percentage || 'their'}% UG. Use this actual data in your response.]`
      }
      
      if (jobsData && jobsData.length > 0 && isJobQuery) {
        const companyList = [...new Set(jobsData.map(job => job.company_name).filter(Boolean))].join(', ')
        reminder += `\n\n[IMPORTANT: ONLY mention companies from the available jobs list in the system prompt: ${companyList}. Do NOT mention any other companies. If asked about a company not in the list, redirect to available companies.]`
      } else if (isJobQuery && (!jobsData || jobsData.length === 0)) {
        reminder += '\n\n[IMPORTANT: There are no active jobs in the portal. Do NOT mention any specific companies. Tell the student to check back later.]'
      }
      
      if (applicationsData && applicationsData.length > 0) {
        reminder += '\n\n[IMPORTANT: Use their actual application status from the system prompt above when answering about applications.]'
      }
      
      if (reminder) {
        openaiMessages[lastUserMessageIndex].content += reminder
      }
    }

    // Add job eligibility context if asking about jobs and we have student data
    if (isJobQuery && studentData && jobsData.length > 0) {
      // Add eligibility info for mentioned jobs or top relevant jobs
      const mentionedJobs = jobsData.filter(job => 
        lastMessageContent.includes(job.company_name?.toLowerCase() || '') || 
        lastMessageContent.includes(job.title?.toLowerCase() || '')
      )
      
      // If specific jobs mentioned, check those; otherwise check top 5 jobs
      const jobsToCheck = mentionedJobs.length > 0 ? mentionedJobs : jobsData.slice(0, 5)
      
      if (jobsToCheck.length > 0 && lastUserMessageIndex >= 0) {
        const eligibilityInfo = jobsToCheck.map(job => {
          const eligibility = checkJobEligibility(job, studentData)
          return `${job.company_name} - ${job.title}: ${eligibility.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}${eligibility.reasons.length > 0 ? ` - ${eligibility.reasons.join('; ')}` : ''}`
        }).join('\n')
        
        openaiMessages[lastUserMessageIndex].content += `\n\n[ELIGIBILITY CHECK RESULTS FOR THEIR PROFILE:\n${eligibilityInfo}\nUse these results in your response.]`
      }
    }
    
    console.log('📤 Sending to OpenAI:', {
      messagesCount: openaiMessages.length,
      hasResumeContext: !!resumeContext,
      hasStudentData: !!studentData,
      jobsCount: jobsData.length,
      applicationsCount: applicationsData.length,
      resumeContextLength: resumeContext?.length || 0,
      lastUserMessage: openaiMessages[openaiMessages.length - 1]?.content?.substring(0, 100)
    })

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for cost-effectiveness, can upgrade to gpt-4o if needed
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Handle OpenAI API errors
    if (error.response) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.response.statusText}` },
        { status: error.response.status || 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


