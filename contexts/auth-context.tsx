"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { StudentDetails } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

interface AuthContextType {
  student: StudentDetails | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  getStudentByEmail: (email: string) => Promise<StudentDetails | null>
  getStudentByUserId: (userId: string) => Promise<StudentDetails | null>
  resetPassword: (email: string) => Promise<boolean>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  student: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  checkAuth: async () => {},
  getStudentByEmail: async () => null,
  getStudentByUserId: async () => null,
  resetPassword: async () => false,
  updatePassword: async () => false,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get student details using user_id (more reliable)
        const studentData = await getStudentByUserId(user.id)
        if (studentData) {
          setStudent(studentData)
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStudentByUserId = async (userId: string): Promise<StudentDetails | null> => {
    try {
      const response = await fetch(`/api/student/profile?student_id=${encodeURIComponent(userId)}`)
      if (response.ok) {
        const result = await response.json()
        return result.data
      }
    } catch (error) {
      console.error('Error fetching student by user_id:', error)
    }
    return null
  }

  const getStudentByEmail = async (email: string): Promise<StudentDetails | null> => {
    try {
      const response = await fetch(`/api/student/profile?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const result = await response.json()
        return result.data
      }
    } catch (error) {
      console.error('Error fetching student:', error)
    }
    return null
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const studentData = await getStudentByUserId(data.user.id)
        if (studentData) {
          setStudent(studentData)
          return true
        }
      }
    } catch (error) {
      console.error('Login error:', error)
    }
    return false
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setStudent(null)
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Password reset error:', error)
      return false
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // First verify current password by trying to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('User not authenticated')
      }

      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError
      return true
    } catch (error) {
      console.error('Password update error:', error)
      return false
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        student, 
        isLoading, 
        login, 
        logout, 
        checkAuth,
        getStudentByEmail,
        getStudentByUserId,
        resetPassword,
        updatePassword 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}