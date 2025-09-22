// Optimized API utilities for high-performance operations
import { supabaseAdmin, connectionPool, SupabaseQueryOptimizer, PerformanceMonitor } from './supabase-optimized'
import { cacheManager } from './cache-manager'
import { rateLimiter, RequestBatcher, CircuitBreaker } from './rate-limiter'

// High-performance API class
export class OptimizedAPI {
  
  // Student operations
  static async getStudentProfile(userId: string, clientId: string = 'server') {
    // Check rate limit
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getStudentProfile')
    
    try {
      return await cacheManager.cacheStudentProfile(userId, async () => {
        return await CircuitBreaker.execute(
          'studentProfile',
          async () => {
            const { data, error } = await supabaseAdmin
              .from('student_details')
              .select('*')
              .eq('user_id', userId)
              .single()
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  static async getStudentByRegNo(regNo: string, clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getStudentByRegNo')
    
    try {
      return await cacheManager.cacheStudent(regNo, async () => {
        return await CircuitBreaker.execute(
          'studentByRegNo',
          async () => {
            const { data, error } = await supabaseAdmin
              .from('student_details')
              .select('*')
              .eq('college_reg_no', regNo)
              .single()
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  // Jobs operations
  static async getActiveJobs(clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getActiveJobs')
    
    try {
      return await cacheManager.cacheJobs('active', async () => {
        return await CircuitBreaker.execute(
          'activeJobs',
          async () => {
            const { data, error } = await supabaseAdmin
              .from('jobs')
              .select('*')
              .eq('status', 'active')
              .order('created_at', { ascending: false })
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  static async getJobById(id: string, clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getJobById')
    
    try {
      return await cacheManager.cacheJob(id, async () => {
        return await CircuitBreaker.execute(
          'jobById',
          async () => {
            const { data, error } = await supabaseAdmin
              .from('jobs')
              .select('*')
              .eq('id', id)
              .single()
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  // Applications operations
  static async getStudentApplications(studentRegNo: string, clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getStudentApplications')
    
    try {
      return await cacheManager.cacheApplications(studentRegNo, async () => {
        return await CircuitBreaker.execute(
          'studentApplications',
          async () => {
            const { data, error } = await supabaseAdmin
              .from('application_status')
              .select(`
                *,
                jobs:job_id (
                  title,
                  company_name,
                  package_min,
                  package_max
                )
              `)
              .eq('student_reg_no', studentRegNo)
              .order('applied_at', { ascending: false })
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  // Dashboard operations with batched queries
  static async getDashboardStats(clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:admin')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getDashboardStats')
    
    try {
      return await cacheManager.cacheDashboardStats(async () => {
        return await RequestBatcher.batch('dashboardStats', async () => {
          return await CircuitBreaker.execute(
            'dashboardStats',
            async () => {
              // Use materialized view if available, otherwise calculate
              const { data: materializedStats, error: materializedError } = await supabaseAdmin
                .from('dashboard_stats_fast')
                .select('*')
                .single()
              
              if (!materializedError && materializedStats) {
                return materializedStats
              }
              
              // Fallback to individual queries with connection pooling
              const connections = connectionPool.getBatchConnections(6)
              
              const [
                studentsResult,
                jobsResult,
                applicationsResult,
                grievancesResult,
                placedStudentsResult,
                avgPackageResult
              ] = await Promise.all([
                connections[0].from('student_details').select('id', { count: 'exact' }),
                connections[1].from('jobs').select('id', { count: 'exact' }).eq('status', 'active'),
                connections[2].from('application_status').select('id', { count: 'exact' }),
                connections[3].from('grievance_reports').select('id', { count: 'exact' }).eq('status', 'submitted'),
                connections[4].from('student_details').select('id', { count: 'exact' }).not('placement_status', 'is', null),
                connections[5].from('student_details').select('placement_status').not('placement_status', 'is', null)
              ])
              
              if (studentsResult.error) throw studentsResult.error
              if (jobsResult.error) throw jobsResult.error
              if (applicationsResult.error) throw applicationsResult.error
              if (grievancesResult.error) throw grievancesResult.error
              if (placedStudentsResult.error) throw placedStudentsResult.error
              if (avgPackageResult.error) throw avgPackageResult.error
              
              // Calculate average package from placement status
              const placements = avgPackageResult.data?.map(d => d.placement_status).filter(Boolean) as any[] || []
              const packages = placements
                .map(status => status?.max_ctc)
                .filter(ctc => ctc && ctc > 0)
              
              const avgPackage = packages.length > 0 
                ? packages.reduce((sum, pkg) => sum + (Number(pkg) / 100000), 0) / packages.length 
                : 0
              
              return {
                total_students: studentsResult.count || 0,
                active_jobs: jobsResult.count || 0,
                total_applications: applicationsResult.count || 0,
                pending_grievances: grievancesResult.count || 0,
                placed_students: placedStudentsResult.count || 0,
                average_package: Math.round(avgPackage * 10) / 10,
                last_updated: new Date().toISOString()
              }
            }
          )
        })
      })
    } finally {
      timer()
    }
  }
  
  // Grievances operations
  static async getGrievances(studentRegNo?: string, clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:default')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getGrievances')
    
    try {
      return await cacheManager.cacheGrievances(studentRegNo, async () => {
        return await CircuitBreaker.execute(
          'grievances',
          async () => {
            let query = supabaseAdmin
              .from('grievance_reports')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (studentRegNo) {
              query = query.eq('student_reg_no', studentRegNo)
            }
            
            const { data, error } = await query
            
            if (error) throw error
            return data
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  // Company report operations
  static async getCompanyReport(company: string, clientId: string = 'server') {
    if (!rateLimiter.isAllowed(clientId, 'api:admin')) {
      throw new Error('Rate limit exceeded')
    }
    
    const timer = PerformanceMonitor.startTimer('getCompanyReport')
    
    try {
      return await cacheManager.cacheCompanyReport(company, async () => {
        return await CircuitBreaker.execute(
          'companyReport',
          async () => {
            let query = supabaseAdmin
              .from('application_status')
              .select(`
                *,
                jobs:job_id (
                  company_name,
                  title,
                  package_min,
                  package_max
                ),
                student_details!inner (
                  first_name,
                  college_reg_no,
                  branch,
                  ug_percentage,
                  placement_status
                )
              `)
              .order('applied_at', { ascending: false })
            
            if (company !== 'all') {
              query = query.eq('company_name', company)
            }
            
            const { data, error } = await query
            
            if (error) throw error
            
            // Transform data for report format
            return data?.map(item => ({
              company_name: item.jobs?.company_name || item.company_name,
              job_title: item.jobs?.title || 'N/A',
              student_name: item.student_details?.first_name || 'N/A',
              student_reg_no: item.student_reg_no,
              branch: item.student_details?.branch || 'N/A',
              ug_percentage: item.student_details?.ug_percentage || 'N/A',
              status: item.current_stage,
              package: item.jobs?.package_max || item.jobs?.package_min || 0,
              applied_at: item.applied_at
            })) || []
          }
        )
      })
    } finally {
      timer()
    }
  }
  
  // Cache invalidation methods for data updates
  static invalidateUserCache(regNo: string, userId: string) {
    cacheManager.invalidateUserData(regNo, userId)
  }
  
  static invalidateJobsCache() {
    cacheManager.invalidateJobs()
  }
  
  static invalidateDashboardCache() {
    cacheManager.invalidateDashboardStats()
  }
  
  // Performance monitoring
  static getPerformanceStats() {
    return {
      queryStats: PerformanceMonitor.getAllStats(),
      cacheStats: cacheManager.getStats(),
      rateLimitStats: rateLimiter.getStats(),
      circuitBreakerStats: {
        studentProfile: CircuitBreaker.getStatus('studentProfile'),
        activeJobs: CircuitBreaker.getStatus('activeJobs'),
        dashboardStats: CircuitBreaker.getStatus('dashboardStats')
      }
    }
  }
}