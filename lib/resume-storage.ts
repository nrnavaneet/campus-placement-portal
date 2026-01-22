// Shared in-memory storage for resume data
// In production, replace this with Supabase table or Redis

interface ResumeData {
  resumeText: string
  chunks: string[]
  embeddings: number[][]
  uploadedAt: Date
}

const resumeStorage = new Map<string, ResumeData>()

export function storeResume(userId: string, data: ResumeData) {
  resumeStorage.set(userId, data)
}

export function getResume(userId: string): ResumeData | null {
  return resumeStorage.get(userId) || null
}

export function hasResume(userId: string): boolean {
  return resumeStorage.has(userId)
}

export function deleteResume(userId: string): boolean {
  return resumeStorage.delete(userId)
}

