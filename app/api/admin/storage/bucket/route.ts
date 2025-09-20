import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key
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

export async function GET() {
  try {
    console.log('Checking storage bucket...')

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({ error: bucketsError.message }, { status: 500 })
    }

    console.log('Available buckets:', buckets)
    
    const placementsBucket = buckets.find(bucket => bucket.id === 'placements')
    
    if (!placementsBucket) {
      console.log('Placements bucket not found, creating...')
      
      // Create bucket
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('placements', {
        public: false
      })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      
      console.log('Bucket created successfully:', createData)
      
      return NextResponse.json({ 
        message: 'Placements bucket created successfully',
        bucket: createData
      })
    } else {
      console.log('Placements bucket already exists:', placementsBucket)
      
      return NextResponse.json({ 
        message: 'Placements bucket already exists',
        bucket: placementsBucket
      })
    }

  } catch (error) {
    console.error('Error in bucket check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    console.log('Force creating storage bucket...')

    // Force create bucket
    const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('placements', {
      public: false
    })
    
    if (createError) {
      console.error('Error creating bucket:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
    
    console.log('Bucket created successfully:', createData)
    
    return NextResponse.json({ 
      message: 'Placements bucket created successfully',
      bucket: createData
    })

  } catch (error) {
    console.error('Error in bucket creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}