import { createClient } from "@supabase/supabase-js"

const RESUME_BUCKET = "placements"
const MAX_RESUME_SIZE = 2 * 1024 * 1024 // 2MB

// Use environment variables or fallback to placeholder
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey || "your-anon-key", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Create admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey || "your-anon-key", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

// Check if we're in a development environment without proper Supabase setup
const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "https://your-project-id.supabase.co" ||
  supabaseAnonKey === "your-anon-key"

// Test network connectivity to Supabase
const testSupabaseConnectivity = async () => {
  if (typeof window !== 'undefined' && !isDemoMode) {
    try {
      const response = await fetch(`${supabaseUrl}/health`, { 
        method: 'GET',
        mode: 'no-cors'  // Allow cross-origin requests
      })
      console.log('Supabase connectivity test passed')
      return true
    } catch (error) {
      console.error('Supabase connectivity failed:', error)
      console.warn('Falling back to demo mode due to connectivity issues')
      return false
    }
  }
  return !isDemoMode
}

if (isDemoMode && typeof window !== "undefined") {
  console.warn("⚠️ Running in demo mode. Data will not be saved to Supabase.")
} else if (typeof window !== "undefined") {
  console.log(`🔗 Connecting to Supabase at: ${supabaseUrl}`)
  testSupabaseConnectivity()
}

// Generate proper UUID for demo mode
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper function to normalize branch name for consistent folder naming
export function normalizeBranchName(branch: string): string {
  return branch.toLowerCase().replace(/\s+/g, "-")
}

// Helper function to get branch-wise resume path
export function getResumeStoragePath(branch: string, regNo: string): string {
  const branchFolder = normalizeBranchName(branch)
  return `${RESUME_BUCKET}/resumes/${branchFolder}/${regNo.toUpperCase()}.pdf`
}

// Helper function to upload resume with branch-wise storage and replacement logic
export async function uploadResume(file: File, branch: string, regNo: string, existingBranch?: string) {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are allowed.")
  }
  if (file.size > MAX_RESUME_SIZE) {
    throw new Error("Resume exceeds the maximum size of 2MB.")
  }

  // If there's an existing resume with a different branch casing, delete it first
  if (existingBranch && normalizeBranchName(existingBranch) !== normalizeBranchName(branch)) {
    try {
      await deleteResume(existingBranch, regNo)
    } catch (error) {
      console.warn("Failed to delete old resume:", error)
    }
  }

  const filePath = getResumeStoragePath(branch, regNo)

  const { data, error } = await supabase.storage.from(RESUME_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true, // This will replace existing file with same path
  })

  if (error) {
    throw new Error(`Resume upload failed: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(filePath)

  return { data, publicUrl }
}

// Helper function to delete resume
export async function deleteResume(branch: string, regNo: string) {
  const filePath = getResumeStoragePath(branch, regNo)
  const { error } = await supabase.storage.from(RESUME_BUCKET).remove([filePath])

  if (error) {
    console.warn("Failed to delete resume:", error)
    return false
  }

  return true
}

// Helper function to download resume
// Helper function to download resume from Supabase storage only
export async function downloadResume(resumeUrl: string, fileName: string) {
  try {
    // Check if resume URL exists and is valid
    if (!resumeUrl || resumeUrl.startsWith("/mock-storage/")) {
      throw new Error("No resume uploaded. Please upload your resume first.")
    }

    const response = await fetch(resumeUrl)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Resume not found. Please upload your resume first.")
      }
      throw new Error(`Failed to download resume: ${response.statusText}`)
    }

    const blob = await response.blob()
    if (blob.size === 0) {
      throw new Error("Resume file is empty. Please upload your resume again.")
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error("Resume download failed:", error)
    throw new Error(error.message || "Failed to download resume from storage")
  }
}

// Mock data for demo mode
const mockStudentData = {
  id: generateUUID(),
  user_id: generateUUID(),
  first_name: "Demo",
  gender: "Male" as const,
  college_reg_no: "22DEMO001",
  pwd: false,
  date_of_birth: "2000-01-01",
  college_email: "22demo001@msruas.ac.in",
  personal_email: "demo@gmail.com",
  mobile_number: "+91 9876543210",
  branch: "Computer Science",
  ug_percentage: 85.5,
  active_backlogs: false,
  resume_url: "/mock-storage/placements/resumes/computer-science/22DEMO001.pdf",
  placement_status: {
    offers: [],
    accepted_offers: 0,
    max_ctc: 0,
    max_offers_allowed: 3,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockJobs = [
  {
    id: "job-1",
    title: "Software Developer",
    company_name: "TechCorp Solutions",
    company_logo: "/placeholder.svg?height=60&width=60&text=TC",
    description:
      "Join our dynamic team as a Software Developer. Work on cutting-edge projects using modern technologies like React, Node.js, and cloud platforms. You will be responsible for developing scalable web applications and collaborating with cross-functional teams.",
    package_min: 600000,
    package_max: 1200000,
    eligibility_criteria: { experience: "0-2 years", skills: ["JavaScript", "React", "Node.js"] },
    branches_allowed: ["Computer Science", "Information Technology", "Electronics and Communication"],
    min_ug_percentage: 70.0,
    no_backlogs_required: true,
    counts_as_offer: true,
    timeline: [
      { stage: "Application", date: "2024-02-01", description: "Submit application with resume" },
      { stage: "Online Test", date: "2024-02-15", description: "Technical assessment" },
      { stage: "Interview", date: "2024-02-25", description: "Technical and HR rounds" },
      { stage: "Result", date: "2024-03-05", description: "Final selection results" },
    ],
    status: "active",
    application_deadline: "2024-12-31T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "job-2",
    title: "Data Analyst Intern",
    company_name: "DataViz Inc",
    company_logo: "/placeholder.svg?height=60&width=60&text=DV",
    description:
      "Exciting internship opportunity to work with big data and analytics. Perfect for students looking to gain industry experience. You will work on real-world data projects and learn from experienced data scientists.",
    package_min: 25000,
    package_max: 40000,
    eligibility_criteria: { experience: "Fresher", skills: ["Python", "SQL", "Excel"] },
    branches_allowed: ["Computer Science", "Information Technology", "Mathematics", "Statistics"],
    min_ug_percentage: 65.0,
    no_backlogs_required: true,
    counts_as_offer: false,
    timeline: [
      { stage: "Application", date: "2024-01-20", description: "Submit application" },
      { stage: "Assessment", date: "2024-02-05", description: "Data analysis task" },
      { stage: "Interview", date: "2024-02-12", description: "Technical discussion" },
      { stage: "Selection", date: "2024-02-20", description: "Internship confirmation" },
    ],
    status: "upcoming",
    application_deadline: "2024-12-25T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "job-3",
    title: "Frontend Developer",
    company_name: "InnovateTech",
    company_logo: "/placeholder.svg?height=60&width=60&text=IT",
    description:
      "Looking for a creative Frontend Developer to join our UI/UX team. Work on modern web applications using React, TypeScript, and cutting-edge design systems.",
    package_min: 500000,
    package_max: 900000,
    eligibility_criteria: { experience: "0-1 years", skills: ["React", "TypeScript", "CSS"] },
    branches_allowed: ["Computer Science", "Information Technology"],
    min_ug_percentage: 75.0,
    no_backlogs_required: true,
    counts_as_offer: true,
    timeline: [
      { stage: "Application", date: "2024-01-25", description: "Submit portfolio and resume" },
      { stage: "Portfolio Review", date: "2024-02-08", description: "Technical portfolio assessment" },
      { stage: "Technical Interview", date: "2024-02-18", description: "Coding and design discussion" },
      { stage: "Final Round", date: "2024-02-28", description: "Cultural fit and offer discussion" },
    ],
    status: "active",
    application_deadline: "2024-12-20T23:59:59.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
]

const mockGrievances = [
  {
    id: generateUUID(),
    student_reg_no: "22ETCS001234",
    student_name: "John Doe",
    issue_type: "Application Status",
    message:
      "I haven't received any update on my application for TechCorp Solutions. It's been 2 weeks since I applied.",
    contact_email: "22etcs001234@msruas.ac.in",
    status: "submitted",
    admin_response: null,
    created_at: "2024-01-15T10:30:00.000Z",
    updated_at: "2024-01-15T10:30:00.000Z",
  },
  {
    id: generateUUID(),
    student_reg_no: "22ETCS001235",
    student_name: "Jane Smith",
    issue_type: "Technical Issue",
    message: "Unable to upload resume. Getting error message every time I try to upload PDF file.",
    contact_email: "22etcs001235@msruas.ac.in",
    status: "in_progress",
    admin_response: "We are looking into this issue. Please try again in a few hours.",
    created_at: "2024-01-14T14:20:00.000Z",
    updated_at: "2024-01-14T16:45:00.000Z",
  },
  {
    id: generateUUID(),
    student_reg_no: "22MECH001236",
    student_name: "Mike Johnson",
    issue_type: "Eligibility Query",
    message: "My branch is not listed in the eligible branches for most jobs. Can this be reviewed?",
    contact_email: "22mech001236@msruas.ac.in",
    status: "resolved",
    admin_response: "We have updated the eligibility criteria for several positions to include Mechanical Engineering.",
    created_at: "2024-01-10T09:15:00.000Z",
    updated_at: "2024-01-12T11:30:00.000Z",
  },
]

// Enhanced mock Supabase client for demo mode
const createMockSupabase = () => {
  return {
    auth: {
      signUp: async ({ email, password }: { email: string; password: string }) => {
        // This is a demo/development function - use actual Supabase in production
        return supabase.auth.signUp({ email, password })
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // This is a demo/development function - use actual Supabase in production  
        return supabase.auth.signInWithPassword({ email, password })
      },
      getUser: async () => {
        // This is a demo/development function - use actual Supabase in production
        return supabase.auth.getUser()
      },
      signOut: async () => {
        // This is a demo/development function - use actual Supabase in production
        return supabase.auth.signOut()
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === "student_details") {
              const profile = localStorage.getItem("student_profile")
              if (profile) {
                return { data: JSON.parse(profile), error: null }
              }
              return { data: null, error: { code: "PGRST116", message: "No rows found" } }
            }
            if (table === "jobs") {
              const allJobs = JSON.parse(localStorage.getItem("all_jobs") || JSON.stringify(mockJobs))
              return { data: allJobs.find((j: any) => j.id === value), error: null }
            }
            return { data: null, error: null }
          },
        }),
        // Add support for fetching all records
        then: async (callback: any) => {
          let data = []
          if (table === "jobs") {
            data = JSON.parse(localStorage.getItem("all_jobs") || JSON.stringify(mockJobs))
          } else if (table === "student_details") {
            data = JSON.parse(localStorage.getItem("all_students") || "[]")
          } else if (table === "grievance_reports") {
            data = JSON.parse(localStorage.getItem("all_grievances") || JSON.stringify(mockGrievances))
          }
          return callback({ data, error: null })
        },
      }),
      insert: (data: any) => {
        const mockInsert = async () => {
          if (table === "student_details") {
            const profileData = { ...mockStudentData, ...data, id: generateUUID() }
            localStorage.setItem("student_profile", JSON.stringify(profileData))

            const allStudents = JSON.parse(localStorage.getItem("all_students") || "[]")
            allStudents.push(profileData)
            localStorage.setItem("all_students", JSON.stringify(allStudents))

            return { data: profileData, error: null }
          }
          if (table === "jobs") {
            const jobData = { 
              ...data, 
              id: generateUUID(), 
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            const existingJobs = JSON.parse(localStorage.getItem("all_jobs") || JSON.stringify(mockJobs))
            existingJobs.push(jobData)
            localStorage.setItem("all_jobs", JSON.stringify(existingJobs))

            // Add to recent activities
            const activities = JSON.parse(localStorage.getItem("recent_activities") || "[]")
            activities.unshift({
              id: generateUUID(),
              type: "job_posted",
              title: "New job posted",
              description: `${jobData.company_name} - ${jobData.title}`,
              timestamp: new Date().toISOString(),
            })
            localStorage.setItem("recent_activities", JSON.stringify(activities.slice(0, 10)))

            return { data: jobData, error: null }
          }
          if (table === "grievance_reports") {
            const grievanceData = { ...data, id: generateUUID(), created_at: new Date().toISOString() }
            const existingGrievances = JSON.parse(
              localStorage.getItem("all_grievances") || JSON.stringify(mockGrievances),
            )
            existingGrievances.push(grievanceData)
            localStorage.setItem("all_grievances", JSON.stringify(existingGrievances))
            return { data: grievanceData, error: null }
          }
          if (table === "application_status") {
            const applicationData = { ...data, id: generateUUID(), applied_at: new Date().toISOString() }
            const existingApplications = JSON.parse(localStorage.getItem("all_applications") || "[]")
            existingApplications.push(applicationData)
            localStorage.setItem("all_applications", JSON.stringify(existingApplications))
            return { data: applicationData, error: null }
          }
          return { data, error: null }
        }

        return {
          select: (columns?: string) => ({
            single: () => mockInsert(),
            then: (callback: any) => mockInsert().then(callback),
          }),
          then: (callback: any) => mockInsert().then(callback),
        }
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            if (table === "student_details") {
              const currentProfile = JSON.parse(localStorage.getItem("student_profile") || "{}")
              const updatedProfile = { ...currentProfile, ...data, updated_at: new Date().toISOString() }
              localStorage.setItem("student_profile", JSON.stringify(updatedProfile))
              return callback({ data: updatedProfile, error: null })
            }
            if (table === "grievance_reports") {
              const allGrievances = JSON.parse(localStorage.getItem("all_grievances") || JSON.stringify(mockGrievances))
              const updatedGrievances = allGrievances.map((g: any) =>
                g.id === value ? { ...g, ...data, updated_at: new Date().toISOString() } : g,
              )
              localStorage.setItem("all_grievances", JSON.stringify(updatedGrievances))
              return callback({ data: data, error: null })
            }
            return callback({ data, error: null })
          },
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: async (callback: any) => {
            return callback({ data: null, error: null })
          },
        }),
      }),
    }),
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          // Simulate successful upload
          return { error: null, data: { path } }
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/mock-storage/${path}` },
        }),
      }),
    },
  }
}

// Create the actual Supabase client
const createRealSupabase = () => {
  return {
    auth: supabase.auth,
    from: (table: string) => ({
      select: (columns?: string) => {
        const query = supabase.from(table).select(columns || "*")
        return {
          eq: (column: string, value: any) => ({
            single: () => query.eq(column, value).single(),
          }),
          // Return the query itself for fetching all records
          then: (callback: any) => query.then(callback),
        }
      },
      insert: (data: any) => {
        const insertQuery = supabase.from(table).insert(data)
        return {
          select: (columns?: string) => {
            const selectQuery = insertQuery.select(columns || "*")
            return {
              single: () => selectQuery.single(),
              then: (callback: any) => selectQuery.then(callback),
            }
          },
          then: (callback: any) => insertQuery.then(callback),
        }
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => supabase.from(table).update(data).eq(column, value),
      }),
      delete: () => ({
        eq: (column: string, value: any) => supabase.from(table).delete().eq(column, value),
      }),
    }),
    storage: supabase.storage,
  }
}

// Create admin client that uses service role key
const createAdminSupabase = () => {
  const adminClient = supabaseServiceKey && !isDemoMode ? supabaseAdmin : supabase
  
  return {
    auth: adminClient.auth,
    from: (table: string) => ({
      select: (columns?: string) => {
        const query = adminClient.from(table).select(columns || "*")
        return {
          eq: (column: string, value: any) => ({
            single: () => query.eq(column, value).single(),
          }),
          then: (callback: any) => query.then(callback),
        }
      },
      insert: (data: any) => {
        const insertQuery = adminClient.from(table).insert(data)
        return {
          select: (columns?: string) => {
            const selectQuery = insertQuery.select(columns || "*")
            return {
              single: () => selectQuery.single(),
              then: (callback: any) => selectQuery.then(callback),
            }
          },
          then: (callback: any) => insertQuery.then(callback),
        }
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => adminClient.from(table).update(data).eq(column, value),
      }),
      delete: () => ({
        eq: (column: string, value: any) => adminClient.from(table).delete().eq(column, value),
      }),
    }),
    storage: adminClient.storage,
  }
}

export const supabaseClient = isDemoMode ? createMockSupabase() : createRealSupabase()
export const supabaseAdminClient = isDemoMode ? createMockSupabase() : createAdminSupabase()

// Database types
export interface StudentDetails {
  id: string
  user_id: string
  first_name: string
  gender: "Male" | "Female" | "Other"
  college_reg_no: string
  pwd: boolean
  date_of_birth: string
  college_email: string
  personal_email: string
  mobile_number: string
  branch: string
  ug_percentage: number
  active_backlogs: boolean
  resume_url?: string
  placement_status: {
    offers: any[]
    accepted_offers: number
    max_ctc: number
    max_offers_allowed: number
  }
  tenth_percentage?: number
  twelfth_percentage?: number
  course?: string
  current_location?: string
  year_of_graduation?: number
  verification_status?: "pending_verification" | "email_verified" | "verified"
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  title: string
  company_name: string
  company_logo?: string
  description: string
  package_min: number
  package_max: number
  eligibility_criteria: any
  branches_allowed: string[]
  min_ug_percentage: number
  min_tenth_percentage?: number
  min_twelfth_percentage?: number
  eligible_courses?: string[]
  no_backlogs_required: boolean
  counts_as_offer: boolean
  no_offer?: boolean
  timeline: any[]
  status: "upcoming" | "active" | "closed"
  application_deadline: string
  tpo?: string
  created_at: string
  updated_at: string
}

export interface ApplicationStatus {
  id: string
  student_reg_no: string
  job_id: string
  company_name: string
  current_stage: string
  stage_history: any[]
  applied_at: string
  updated_at: string
}

export interface GrievanceReport {
  id: string
  student_reg_no?: string
  student_name?: string
  issue_type: string
  message: string
  contact_email: string
  status: "submitted" | "in_progress" | "resolved"
  admin_response?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  username: string
  email: string
  password_hash: string
  role: string
  created_at: string
}

// Initialize demo data
if (typeof window !== "undefined" && isDemoMode) {
  const demoStudents = [
    {
      ...mockStudentData,
      id: generateUUID(),
      first_name: "John",
      college_reg_no: "22ETCS001234",
      college_email: "22etcs001234@msruas.ac.in",
      branch: "Computer Science",
      ug_percentage: 85.5,
      resume_url: "/mock-storage/placements/resumes/computer-science/22ETCS001234.pdf",
    },
    {
      ...mockStudentData,
      id: generateUUID(),
      first_name: "Jane",
      college_reg_no: "22ETCS001235",
      college_email: "22etcs001235@msruas.ac.in",
      branch: "Information Technology",
      ug_percentage: 78.2,
      resume_url: "/mock-storage/placements/resumes/information-technology/22ETCS001235.pdf",
    },
    {
      ...mockStudentData,
      id: generateUUID(),
      first_name: "Mike",
      college_reg_no: "22MECH001236",
      college_email: "22mech001236@msruas.ac.in",
      branch: "Mechanical Engineering",
      ug_percentage: 82.1,
      resume_url: "/mock-storage/placements/resumes/mechanical-engineering/22MECH001236.pdf",
    },
  ]

  if (!localStorage.getItem("all_students")) {
    localStorage.setItem("all_students", JSON.stringify(demoStudents))
  }

  if (!localStorage.getItem("all_jobs")) {
    localStorage.setItem("all_jobs", JSON.stringify(mockJobs))
  }

  if (!localStorage.getItem("all_grievances")) {
    localStorage.setItem("all_grievances", JSON.stringify(mockGrievances))
  }

  if (!localStorage.getItem("recent_activities")) {
    const initialActivities = [
      {
        id: generateUUID(),
        type: "job_posted",
        title: "New job posted",
        description: "TechCorp Solutions - Software Developer",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: generateUUID(),
        type: "student_registered",
        title: "Student registered",
        description: "22ETCS001245 completed profile",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
    ]
    localStorage.setItem("recent_activities", JSON.stringify(initialActivities))
  }
}
