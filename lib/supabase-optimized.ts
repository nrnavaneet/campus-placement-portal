import { createClient } from '@supabase/supabase-js'

// Configuration for high-performance scenarios
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-info': 'campus-placement-portal'
    }
  },
  // Realtime configuration for minimal overhead
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// Admin client configuration for server-side operations
const adminConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'x-client-info': 'campus-placement-portal-admin'
    }
  }
}

// Main client for client-side operations
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseConfig
)

// Admin client for server-side operations with service role
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  adminConfig
)

// Connection pool manager for high-load scenarios
class ConnectionPoolManager {
  private static instance: ConnectionPoolManager
  private adminClients: Array<ReturnType<typeof createClient>> = []
  private currentIndex = 0
  private readonly poolSize = 10 // Pool of 10 admin connections

  constructor() {
    // Initialize connection pool
    for (let i = 0; i < this.poolSize; i++) {
      this.adminClients.push(
        createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            ...adminConfig,
            global: {
              headers: {
                'x-client-info': `campus-placement-portal-pool-${i}`
              }
            }
          }
        )
      )
    }
  }

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager()
    }
    return ConnectionPoolManager.instance
  }

  // Round-robin connection selection for load balancing
  getConnection() {
    const client = this.adminClients[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.poolSize
    return client
  }

  // Get multiple connections for batch operations
  getBatchConnections(count: number) {
    const connections = []
    for (let i = 0; i < Math.min(count, this.poolSize); i++) {
      connections.push(this.getConnection())
    }
    return connections
  }
}

// Export pooled connection manager
export const connectionPool = ConnectionPoolManager.getInstance()

// High-performance query utilities
export class SupabaseQueryOptimizer {
  // Batch queries to reduce database round trips
  static async batchQuery<T>(
    queries: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = []
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(query => query()))
      results.push(...batchResults)
    }
    
    return results
  }

  // Parallel query execution with connection pooling
  static async parallelQuery<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    const connections = connectionPool.getBatchConnections(queries.length)
    
    return Promise.all(
      queries.map((query, index) => {
        // Use different connections for parallel queries
        return query()
      })
    )
  }

  // Query with automatic retry and exponential backoff
  static async queryWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn()
      } catch (error: any) {
        if (attempt === maxRetries) throw error
        
        // Only retry on connection/timeout errors
        if (error.code && ['PGRST301', 'PGRST302', '57014'].includes(error.code)) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static queryTimes = new Map<string, number[]>()
  
  static startTimer(queryName: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      
      // Store query performance data
      if (!this.queryTimes.has(queryName)) {
        this.queryTimes.set(queryName, [])
      }
      
      const times = this.queryTimes.get(queryName)!
      times.push(duration)
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift()
      }
      
      // Log slow queries (>1000ms)
      if (duration > 1000 && process.env.NODE_ENV === 'development') {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
  }
  
  static getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || []
    if (times.length === 0) return null
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)
    
    return { avg, max, min, count: times.length }
  }
  
  static getAllStats() {
    const stats: Record<string, any> = {}
    for (const [queryName] of this.queryTimes) {
      stats[queryName] = this.getQueryStats(queryName)
    }
    return stats
  }
}

// Export legacy client for backward compatibility
export { supabase as supabaseClient }

// Type exports for better TypeScript support
export type SupabaseClient = typeof supabase
export type SupabaseAdminClient = typeof supabaseAdmin