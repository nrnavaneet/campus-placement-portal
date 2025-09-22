// In-memory cache implementation for high-performance scenarios
// This provides Redis-like functionality without external dependencies

interface CacheItem<T> {
  value: T
  expiresAt: number
  accessCount: number
  lastAccessed: number
}

export class MemoryCache {
  private static instance: MemoryCache
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 1000 // Maximum cache entries
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL
  
  private constructor() {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }
  
  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache()
    }
    return MemoryCache.instance
  }
  
  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
    
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now()
    })
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    // Update access statistics
    item.accessCount++
    item.lastAccessed = Date.now()
    
    return item.value as T
  }
  
  has(key: string): boolean {
    return this.get(key) !== null
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
  
  // Advanced cache operations
  getOrSet<T>(key: string, factory: () => T | Promise<T>, ttlMs?: number): T | Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached
    
    const value = factory()
    
    if (value instanceof Promise) {
      return value.then(resolvedValue => {
        this.set(key, resolvedValue, ttlMs)
        return resolvedValue
      })
    } else {
      this.set(key, value, ttlMs)
      return value
    }
  }
  
  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
  
  // Evict least recently used items when cache is full
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
  
  // Get cache statistics
  getStats() {
    let totalAccess = 0
    let expiredCount = 0
    const now = Date.now()
    
    for (const item of this.cache.values()) {
      totalAccess += item.accessCount
      if (now > item.expiresAt) expiredCount++
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccess,
      expiredCount,
      hitRate: totalAccess > 0 ? (totalAccess / this.cache.size).toFixed(2) : '0.00'
    }
  }
}

// Cache key generators for different data types
export const CacheKeys = {
  student: (regNo: string) => `student:${regNo}`,
  studentProfile: (userId: string) => `student_profile:${userId}`,
  jobs: (status?: string) => status ? `jobs:${status}` : 'jobs:all',
  job: (id: string) => `job:${id}`,
  applications: (studentRegNo: string) => `applications:${studentRegNo}`,
  grievances: (studentRegNo?: string) => studentRegNo ? `grievances:${studentRegNo}` : 'grievances:all',
  dashboardStats: () => 'dashboard:stats',
  branchStats: () => 'branch:stats',
  companyReport: (company: string) => `company_report:${company}`,
  adminActivities: () => 'admin:activities',
} as const

// High-level cache utilities for common operations
export class CacheManager {
  private cache = MemoryCache.getInstance()
  
  // Cache TTL configurations (in milliseconds)
  private static readonly TTL = {
    STUDENT_PROFILE: 10 * 60 * 1000,    // 10 minutes
    JOBS: 5 * 60 * 1000,                 // 5 minutes
    APPLICATIONS: 2 * 60 * 1000,         // 2 minutes
    DASHBOARD_STATS: 30 * 1000,          // 30 seconds
    GRIEVANCES: 1 * 60 * 1000,           // 1 minute
    ADMIN_DATA: 5 * 60 * 1000,           // 5 minutes
  } as const
  
  // Student data caching
  async cacheStudent<T>(regNo: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.student(regNo),
      fetchFn,
      CacheManager.TTL.STUDENT_PROFILE
    ) as Promise<T>
  }
  
  async cacheStudentProfile<T>(userId: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.studentProfile(userId),
      fetchFn,
      CacheManager.TTL.STUDENT_PROFILE
    ) as Promise<T>
  }
  
  // Jobs caching
  async cacheJobs<T>(status: string | undefined, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.jobs(status),
      fetchFn,
      CacheManager.TTL.JOBS
    ) as Promise<T>
  }
  
  async cacheJob<T>(id: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.job(id),
      fetchFn,
      CacheManager.TTL.JOBS
    ) as Promise<T>
  }
  
  // Applications caching
  async cacheApplications<T>(studentRegNo: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.applications(studentRegNo),
      fetchFn,
      CacheManager.TTL.APPLICATIONS
    ) as Promise<T>
  }
  
  // Dashboard stats caching
  async cacheDashboardStats<T>(fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.dashboardStats(),
      fetchFn,
      CacheManager.TTL.DASHBOARD_STATS
    ) as Promise<T>
  }
  
  // Grievances caching
  async cacheGrievances<T>(studentRegNo: string | undefined, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.grievances(studentRegNo),
      fetchFn,
      CacheManager.TTL.GRIEVANCES
    ) as Promise<T>
  }
  
  // Company report caching
  async cacheCompanyReport<T>(company: string, fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.companyReport(company),
      fetchFn,
      CacheManager.TTL.ADMIN_DATA
    ) as Promise<T>
  }
  
  // Admin activities caching
  async cacheAdminActivities<T>(fetchFn: () => Promise<T>): Promise<T> {
    return this.cache.getOrSet(
      CacheKeys.adminActivities(),
      fetchFn,
      CacheManager.TTL.ADMIN_DATA
    ) as Promise<T>
  }
  
  // Cache invalidation methods
  invalidateStudent(regNo: string): void {
    this.cache.delete(CacheKeys.student(regNo))
  }
  
  invalidateStudentProfile(userId: string): void {
    this.cache.delete(CacheKeys.studentProfile(userId))
  }
  
  invalidateJobs(): void {
    // Clear all job-related cache entries
    for (const key of ['active', 'upcoming', 'closed', undefined]) {
      this.cache.delete(CacheKeys.jobs(key))
    }
  }
  
  invalidateApplications(studentRegNo: string): void {
    this.cache.delete(CacheKeys.applications(studentRegNo))
  }
  
  invalidateDashboardStats(): void {
    this.cache.delete(CacheKeys.dashboardStats())
    this.cache.delete(CacheKeys.branchStats())
  }
  
  invalidateGrievances(studentRegNo?: string): void {
    this.cache.delete(CacheKeys.grievances(studentRegNo))
    this.cache.delete(CacheKeys.grievances())
  }
  
  // Batch invalidation for data updates
  invalidateUserData(regNo: string, userId: string): void {
    this.invalidateStudent(regNo)
    this.invalidateStudentProfile(userId)
    this.invalidateApplications(regNo)
    this.invalidateDashboardStats()
  }
  
  // Get cache statistics
  getStats() {
    return this.cache.getStats()
  }
  
  // Manual cache management
  clearAll(): void {
    this.cache.clear()
  }
  
  getSize(): number {
    return this.cache.size()
  }
}

// Export singleton cache manager
export const cacheManager = new CacheManager()

// Helper function to wrap any async function with caching
export function withCache<T extends any[], R>(
  cacheKey: string,
  ttlMs: number,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  const cache = MemoryCache.getInstance()
  
  return async (...args: T): Promise<R> => {
    const key = `${cacheKey}:${JSON.stringify(args)}`
    
    return cache.getOrSet(key, () => fn(...args), ttlMs) as Promise<R>
  }
}