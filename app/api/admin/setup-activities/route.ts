import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key on server side
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

export async function POST() {
  try {
    // Create the recent_activities table using a SQL query
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.recent_activities (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        title TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute the SQL to create the table
    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableQuery
    })

    if (createError) {
      console.error('Error creating table:', createError)
      
      // Try alternative method - direct table creation might not work with RPC
      // Let's try inserting sample data which should auto-create the table structure
      const { error: insertError } = await supabaseAdmin
        .from('recent_activities')
        .insert([
          {
            title: 'System Initialization',
            type: 'system',
            description: 'Campus Placement Portal started successfully'
          }
        ])

      if (insertError) {
        console.error('Error inserting initial data:', insertError)
        return NextResponse.json(
          { 
            error: 'Failed to create recent_activities table', 
            details: insertError.message 
          },
          { status: 500 }
        )
      }
    }

    // Insert some sample activities
    const { error: insertError } = await supabaseAdmin
      .from('recent_activities')
      .insert([
        {
          title: 'Welcome to Campus Placement Portal',
          type: 'system',
          description: 'System initialization completed'
        },
        {
          title: 'Database setup completed',
          type: 'system',
          description: 'All tables and initial data created'
        }
      ])

    if (insertError) {
      console.log('Note: Sample data insertion failed (table might already have data):', insertError.message)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Recent activities table created successfully' 
    })

  } catch (err) {
    console.error('Setup error:', err)
    return NextResponse.json(
      { error: 'Internal server error during setup' },
      { status: 500 }
    )
  }
}