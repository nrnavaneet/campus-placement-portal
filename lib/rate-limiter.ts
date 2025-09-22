// Rate limiting and request optimization for high-load scenarios

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

export class RateLimiter {
  private static instance: RateLimiter
  private limits = new Map<string, RateLimitEntry>()
  
  // Rate limit configurations for different endpoints
  private configs: Record<string, RateLimitConfig> = {
    // API endpoints
    'api:default': { windowMs: 60 * 1000, maxRequests: 100 },        // 100 req/min default
    'api:auth': { windowMs: 60 * 1000, maxRequests: 20 },            // 20 req/min for auth
    'api:search': { windowMs: 60 * 1000, maxRequests: 50 },          // 50 req/min for search
    'api:upload': { windowMs: 60 * 1000, maxRequests: 10 },          // 10 req/min for uploads
    'api:admin': { windowMs: 60 * 1000, maxRequests: 200 },          // 200 req/min for admin
    
    // Page access
    'page:default': { windowMs: 60 * 1000, maxRequests: 200 },       // 200 req/min for pages
    'page:dashboard': { windowMs: 60 * 1000, maxRequests: 100 },     // 100 req/min for dashboard
  }
  
  private constructor() {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }
  
  // Check if request is allowed
  isAllowed(identifier: string, type: string = 'api:default'): boolean {
    const config = this.configs[type] || this.configs['api:default']
    const key = `${type}:${identifier}`
    const now = Date.now()
    
    const entry = this.limits.get(key)
    
    if (!entry) {
      // First request
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false
      })
      return true
    }
    
    // Check if window has expired
    if (now > entry.resetTime) {
      // Reset window
      entry.count = 1
      entry.resetTime = now + config.windowMs
      entry.blocked = false
      return true
    }
    
    // Increment count
    entry.count++
    
    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      entry.blocked = true
      return false
    }
    
    return true
  }
  
  // Get remaining requests for identifier
  getRemaining(identifier: string, type: string = 'api:default'): number {
    const config = this.configs[type] || this.configs['api:default']
    const key = `${type}:${identifier}`
    const entry = this.limits.get(key)
    
    if (!entry) return config.maxRequests
    
    const now = Date.now()
    if (now > entry.resetTime) return config.maxRequests
    
    return Math.max(0, config.maxRequests - entry.count)
  }
  
  // Get reset time for identifier
  getResetTime(identifier: string, type: string = 'api:default'): number {
    const key = `${type}:${identifier}`
    const entry = this.limits.get(key)
    
    if (!entry) return Date.now()
    
    return entry.resetTime
  }
  
  // Add custom rate limit configuration
  setConfig(type: string, config: RateLimitConfig): void {
    this.configs[type] = config
  }
  
  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
  
  // Get statistics
  getStats() {
    return {
      totalEntries: this.limits.size,
      blockedEntries: Array.from(this.limits.values()).filter(e => e.blocked).length,
      configs: this.configs
    }
  }
}

// Request batching utility
export class RequestBatcher {
  private static batches = new Map<string, {
    requests: Array<{
      resolver: (value: any) => void
      rejecter: (error: any) => void
    }>
    timer: NodeJS.Timeout
  }>()
  
  // Batch similar requests together
  static async batch<T>(
    key: string,
    operation: () => Promise<T>,
    delayMs: number = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(key)
      
      if (!batch) {
        // Create new batch
        batch = {
          requests: [],
          timer: setTimeout(async () => {
            const currentBatch = this.batches.get(key)
            if (!currentBatch) return
            
            this.batches.delete(key)
            
            try {
              const result = await operation()
              // Resolve all requests with the same result
              currentBatch.requests.forEach(req => req.resolver(result))
            } catch (error) {
              // Reject all requests with the same error
              currentBatch.requests.forEach(req => req.rejecter(error))
            }
          }, delayMs)
        }
        this.batches.set(key, batch)
      }
      
      // Add request to batch
      batch.requests.push({
        resolver: resolve,
        rejecter: reject
      })
    })
  }
  
  // Clear all batches
  static clear(): void {
    for (const [key, batch] of this.batches.entries()) {
      clearTimeout(batch.timer)
    }
    this.batches.clear()
  }
}

// Request optimization middleware
export class RequestOptimizer {
  private static requestCounts = new Map<string, number>()
  
  // Debounce requests to prevent rapid duplicate calls
  static debounce<T extends any[], R>(
    func: (...args: T) => Promise<R>,
    waitMs: number,
    key?: string
  ): (...args: T) => Promise<R> {
    let timeout: NodeJS.Timeout | null = null
    let lastPromise: Promise<R> | null = null
    
    return async (...args: T): Promise<R> => {
      const requestKey = key || JSON.stringify(args)
      
      if (timeout) {
        clearTimeout(timeout)
      }
      
      if (lastPromise) {
        return lastPromise
      }
      
      lastPromise = new Promise((resolve, reject) => {
        timeout = setTimeout(async () => {
          try {
            const result = await func(...args)
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            lastPromise = null
            timeout = null
          }
        }, waitMs)
      })
      
      return lastPromise
    }
  }
  
  // Throttle requests to limit frequency
  static throttle<T extends any[], R>(
    func: (...args: T) => Promise<R>,
    limitMs: number,
    key?: string
  ): (...args: T) => Promise<R> {
    let lastCall = 0
    let lastResult: R | null = null
    
    return async (...args: T): Promise<R> => {
      const now = Date.now()
      const requestKey = key || 'default'
      
      if (now - lastCall < limitMs && lastResult !== null) {
        return lastResult
      }
      
      lastCall = now
      lastResult = await func(...args)
      
      return lastResult
    }
  }
  
  // Track request frequency for monitoring
  static trackRequest(endpoint: string): void {
    const count = this.requestCounts.get(endpoint) || 0
    this.requestCounts.set(endpoint, count + 1)
  }
  
  // Get request statistics
  static getRequestStats(): Record<string, number> {
    return Object.fromEntries(this.requestCounts)
  }
  
  // Reset statistics
  static resetStats(): void {
    this.requestCounts.clear()
  }
}

// Circuit breaker pattern for API resilience
export class CircuitBreaker {
  private static breakers = new Map<string, {
    failures: number
    lastFailTime: number
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  }>()
  
  private static readonly config = {
    failureThreshold: 5,      // Open circuit after 5 failures
    recoveryTimeMs: 30000,    // Try to recover after 30 seconds
    monitorWindowMs: 60000    // Monitor failures in 1-minute windows
  }
  
  static async execute<T>(
    key: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    let breaker = this.breakers.get(key)
    
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailTime: 0,
        state: 'CLOSED'
      }
      this.breakers.set(key, breaker)
    }
    
    const now = Date.now()
    
    // Reset failures if enough time has passed
    if (now - breaker.lastFailTime > this.config.monitorWindowMs) {
      breaker.failures = 0
      breaker.state = 'CLOSED'
    }
    
    // Check circuit state
    if (breaker.state === 'OPEN') {
      if (now - breaker.lastFailTime > this.config.recoveryTimeMs) {
        breaker.state = 'HALF_OPEN'
      } else {
        if (fallback) {
          return fallback()
        }
        throw new Error(`Circuit breaker OPEN for ${key}`)
      }
    }
    
    try {
      const result = await operation()
      
      // Success - close circuit if it was half-open
      if (breaker.state === 'HALF_OPEN') {
        breaker.failures = 0
        breaker.state = 'CLOSED'
      }
      
      return result
    } catch (error) {
      breaker.failures++
      breaker.lastFailTime = now
      
      // Open circuit if threshold exceeded
      if (breaker.failures >= this.config.failureThreshold) {
        breaker.state = 'OPEN'
      }
      
      if (fallback) {
        return fallback()
      }
      
      throw error
    }
  }
  
  // Get circuit breaker status
  static getStatus(key: string) {
    const breaker = this.breakers.get(key)
    if (!breaker) return { state: 'CLOSED', failures: 0 }
    
    return {
      state: breaker.state,
      failures: breaker.failures,
      lastFailTime: breaker.lastFailTime
    }
  }
}

// Export utilities
export const rateLimiter = RateLimiter.getInstance()

// Middleware for API routes
export function withRateLimit(
  identifier: string,
  type: string = 'api:default'
) {
  return (handler: Function) => {
    return async (...args: any[]) => {
      if (!rateLimiter.isAllowed(identifier, type)) {
        throw new Error('Rate limit exceeded')
      }
      
      RequestOptimizer.trackRequest(type)
      return handler(...args)
    }
  }
}

// Utility function to get client identifier
export function getClientIdentifier(request?: Request): string {
  if (typeof window !== 'undefined') {
    // Client-side: use session storage or generate random ID
    let clientId = sessionStorage.getItem('client-id')
    if (!clientId) {
      clientId = Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('client-id', clientId)
    }
    return clientId
  }
  
  if (request) {
    // Server-side: use IP address or headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    return forwarded || realIP || 'unknown'
  }
  
  return 'server'
}