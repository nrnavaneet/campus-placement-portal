import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // For demo/development - hardcoded admin credentials
    if (username === 'admin' && password === 'admin123') {
      const adminData = {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'admin',
        email: 'admin@msruas.ac.in',
        role: 'admin',
        created_at: new Date().toISOString()
      }
      
      return NextResponse.json({ 
        success: true,
        admin: adminData,
        message: 'Login successful'
      })
    }

    // Get admin from database
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // For development/demo purposes, check if password is plain text "admin123"
    let isValidPassword = false
    
    if (password === 'admin123' && admin.password_hash.includes('$2b$10$rOvHPGkwMtFJfqJZqJqOyOehNvQqzqzQqzqzQqzqzQqzqzQqzqzQq')) {
      // Demo mode - accept plain text password
      isValidPassword = true
    } else {
      // Try bcrypt comparison for properly hashed passwords
      try {
        isValidPassword = await bcrypt.compare(password, admin.password_hash)
      } catch (bcryptError) {
        console.error('Bcrypt comparison failed:', bcryptError)
        // Fallback for demo - simple comparison
        isValidPassword = admin.password_hash === password
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Return admin data (excluding password hash)
    const { password_hash, ...adminData } = admin
    
    return NextResponse.json({ 
      success: true,
      admin: adminData,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}