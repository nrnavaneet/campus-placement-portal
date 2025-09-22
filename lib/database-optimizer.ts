// Database performance optimization and query enhancements
import { supabaseAdmin, connectionPool } from './supabase-optimized'
import { cacheManager } from './cache-manager'

interface PaginationConfig {
  page: number
  limit: number
  orderBy?: string
  ascending?: boolean
}

interface LazyLoadResult<T> {
  data: T[]
  hasMore: boolean
  nextPage?: number
  total?: number
}

class DatabaseOptimizer {
  
  // Lazy loading implementation for large datasets
  static async lazyLoad<T>(
    tableName: string,
    config: PaginationConfig,
    filters?: Record<string, any>
  ): Promise<LazyLoadResult<T>> {
    
    const {
      page = 1,
      limit = 50,
      orderBy = 'created_at',
      ascending = false
    } = config
    
    const offset = (page - 1) * limit
    
    try {
      const client = connectionPool.getConnection()
      
      let query = client
        .from(tableName)
        .select('*', { count: 'exact' })
      
      // Apply simple filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }
      
      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      const hasMore = count ? offset + limit < count : false
      const nextPage = hasMore ? page + 1 : undefined
      
      return {
        data: data as T[],
        hasMore,
        nextPage,
        total: count || 0
      }
      
    } catch (error) {
      console.error('Lazy load error:', error)
      throw error
    }
  }
  
  // Optimized student search
  static async searchStudents(
    searchTerm: string,
    filters?: {
      branch?: string
      status?: string
    },
    pagination?: PaginationConfig
  ) {
    
    try {
      const client = connectionPool.getConnection()
      
      let query = client
        .from('student_details')
        .select(`
          user_id,
          first_name,
          last_name,
          college_reg_no,
          branch,
          ug_percentage,
          placement_status,
          created_at
        `)
      
      // Search across multiple fields
      if (searchTerm) {
        query = query.or(`
          first_name.ilike.%${searchTerm}%,
          last_name.ilike.%${searchTerm}%,
          college_reg_no.ilike.%${searchTerm}%
        `)
      }
      
      // Apply filters
      if (filters?.branch) {
        query = query.eq('branch', filters.branch)
      }
      
      if (filters?.status === 'placed') {
        query = query.not('placement_status', 'is', null)
      } else if (filters?.status === 'unplaced') {
        query = query.is('placement_status', null)
      }
      
      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit
        query = query
          .order(pagination.orderBy || 'created_at', { ascending: pagination.ascending || false })
          .range(offset, offset + pagination.limit - 1)
      } else {
        query = query.order('created_at', { ascending: false }).limit(100)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
      
    } catch (error) {
      console.error('Student search error:', error)
      throw error
    }
  }
  
  // Optimized job search
  static async searchJobs(
    searchTerm?: string,
    filters?: {
      company?: string
      status?: 'active' | 'closed' | 'draft'
    },
    pagination?: PaginationConfig
  ) {
    
    try {
      const client = connectionPool.getConnection()
      
      let query = client
        .from('jobs')
        .select(`
          id,
          title,
          company_name,
          package_min,
          package_max,
          eligible_branches,
          min_cgpa,
          status,
          application_deadline,
          created_at
        `)
      
      if (searchTerm) {
        query = query.or(`
          title.ilike.%${searchTerm}%,
          company_name.ilike.%${searchTerm}%
        `)
      }
      
      if (filters?.company) {
        query = query.eq('company_name', filters.company)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit
        query = query
          .order(pagination.orderBy || 'created_at', { ascending: pagination.ascending || false })
          .range(offset, offset + pagination.limit - 1)
      } else {
        query = query.order('created_at', { ascending: false }).limit(50)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
      
    } catch (error) {
      console.error('Job search error:', error)
      throw error
    }
  }
  
  // Batch operations for better performance
  static async batchInsert(
    tableName: string,
    records: Record<string, unknown>[],
    batchSize = 100
  ): Promise<void> {
    
    if (records.length === 0) return
    
    // Split into batches
    const batches = []
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }
    
    // Process batches
    for (const batch of batches) {
      const client = connectionPool.getConnection()
      
      const { error } = await client
        .from(tableName)
        .insert(batch)
      
      if (error) {
        console.error(`Batch insert error for ${tableName}:`, error)
        throw error
      }
    }
    
    // Invalidate relevant caches
    this.invalidateRelatedCaches(tableName)
  }
  
  // Database health check
  static async checkDatabaseHealth() {
    try {
      const client = connectionPool.getConnection()
      
      const startTime = Date.now()
      
      const { data, error } = await client
        .from('student_details')
        .select('id')
        .limit(1)
      
      const queryTime = Date.now() - startTime
      
      if (error) {
        return {
          status: 'error',
          error: error.message,
          queryTime
        }
      }
      
      return {
        status: queryTime < 100 ? 'excellent' : queryTime < 500 ? 'good' : queryTime < 1000 ? 'fair' : 'slow',
        queryTime,
        connectionPool: {
          status: 'connected'
        }
      }
      
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Cache invalidation helper
  private static invalidateRelatedCaches(tableName: string) {
    switch (tableName) {
      case 'student_details':
        cacheManager.invalidateUserData('', '')
        break
      case 'jobs':
        cacheManager.invalidateJobs()
        break
      case 'application_status':
        cacheManager.invalidateApplications('')
        break
      default:
        cacheManager.invalidateDashboardStats()
    }
  }
}

export default DatabaseOptimizer