// Comprehensive performance monitoring for high-load applications
import type { NextRequest } from 'next/server'

interface SystemMetrics {
  timestamp: Date
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: number
  activeConnections: number
  responseTime: number
  errorRate: number
}

interface APIMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  userId?: string
  clientId?: string
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    database: 'up' | 'down' | 'slow'
    memory: 'normal' | 'high' | 'critical'
    responseTime: 'fast' | 'slow' | 'timeout'
    errorRate: 'low' | 'medium' | 'high'
  }
  metrics: SystemMetrics
  uptime: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: SystemMetrics[] = []
  private apiMetrics: APIMetrics[] = []
  private startTime: Date = new Date()
  private maxMetricsHistory = 1000
  private maxAPIMetricsHistory = 5000
  
  // Thresholds for alerts
  private readonly thresholds = {
    memoryUsage: 0.85,      // 85% memory usage
    responseTime: 2000,     // 2 second response time
    errorRate: 0.05,        // 5% error rate
    dbQueryTime: 1000       // 1 second database query
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  // Record system metrics
  recordSystemMetrics() {
    const memoryUsage = process.memoryUsage()
    const now = new Date()
    
    const metric: SystemMetrics = {
      timestamp: now,
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to milliseconds
      activeConnections: this.getActiveConnections(),
      responseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate()
    }
    
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
    
    return metric
  }
  
  // Record API call metrics
  recordAPICall(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string,
    clientId?: string
  ) {
    const metric: APIMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date(),
      userId,
      clientId
    }
    
    this.apiMetrics.push(metric)
    
    // Keep only recent API metrics
    if (this.apiMetrics.length > this.maxAPIMetricsHistory) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxAPIMetricsHistory)
    }
    
    return metric
  }
  
  // Middleware for automatic API monitoring
  createMiddleware() {
    return (req: NextRequest, res: any, next: () => void) => {
      const startTime = Date.now()
      const endpoint = req.url || 'unknown'
      const method = req.method || 'GET'
      
      // Get client identifier
      const clientId = req.headers.get('x-client-id') || 
                      req.headers.get('x-forwarded-for') || 
                      'unknown'
      
      // Override res.end to capture response time and status
      const originalEnd = res.end
      res.end = function(chunk: any, encoding: any) {
        const responseTime = Date.now() - startTime
        const statusCode = res.statusCode || 200
        
        // Record the API call
        PerformanceMonitor.getInstance().recordAPICall(
          endpoint,
          method,
          responseTime,
          statusCode,
          undefined, // userId can be added if available in req
          clientId
        )
        
        // Call original end method
        originalEnd.call(this, chunk, encoding)
      }
      
      next()
    }
  }
  
  // Health check functionality
  async performHealthCheck(): Promise<HealthCheckResult> {
    const currentMetric = this.recordSystemMetrics()
    const uptime = Date.now() - this.startTime.getTime()
    
    // Check database health (using supabase-optimized connection)
    let dbStatus: 'up' | 'down' | 'slow' = 'up'
    try {
      const { supabaseAdmin } = await import('./supabase-optimized')
      const start = Date.now()
      await supabaseAdmin.from('student_details').select('id').limit(1)
      const queryTime = Date.now() - start
      
      if (queryTime > this.thresholds.dbQueryTime) {
        dbStatus = 'slow'
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      dbStatus = 'down'
    }
    
    // Memory check
    const memoryUsage = currentMetric.memoryUsage.heapUsed / currentMetric.memoryUsage.heapTotal
    const memoryStatus = memoryUsage > this.thresholds.memoryUsage 
      ? 'critical' 
      : memoryUsage > 0.7 
        ? 'high' 
        : 'normal'
    
    // Response time check
    const avgResponseTime = this.getAverageResponseTime()
    const responseTimeStatus = avgResponseTime > this.thresholds.responseTime 
      ? 'timeout' 
      : avgResponseTime > 1000 
        ? 'slow' 
        : 'fast'
    
    // Error rate check
    const errorRate = this.getErrorRate()
    const errorRateStatus = errorRate > this.thresholds.errorRate 
      ? 'high' 
      : errorRate > 0.02 
        ? 'medium' 
        : 'low'
    
    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (dbStatus === 'down' || memoryStatus === 'critical' || responseTimeStatus === 'timeout') {
      overallStatus = 'critical'
    } else if (
      dbStatus === 'slow' || 
      memoryStatus === 'high' || 
      responseTimeStatus === 'slow' || 
      errorRateStatus === 'high'
    ) {
      overallStatus = 'warning'
    }
    
    return {
      status: overallStatus,
      checks: {
        database: dbStatus,
        memory: memoryStatus,
        responseTime: responseTimeStatus,
        errorRate: errorRateStatus
      },
      metrics: currentMetric,
      uptime: Math.round(uptime / 1000) // Convert to seconds
    }
  }
  
  // Get performance statistics
  getPerformanceStats() {
    const recentMetrics = this.metrics.slice(-100) // Last 100 metrics
    const recentAPIMetrics = this.apiMetrics.slice(-500) // Last 500 API calls
    
    if (recentMetrics.length === 0) {
      return {
        systemMetrics: null,
        apiMetrics: null,
        summary: null
      }
    }
    
    // Calculate averages and trends
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => 
      sum + (m.memoryUsage.heapUsed / m.memoryUsage.heapTotal), 0) / recentMetrics.length
    
    const avgResponseTime = recentAPIMetrics.length > 0
      ? recentAPIMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentAPIMetrics.length
      : 0
    
    const errorCount = recentAPIMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = recentAPIMetrics.length > 0 ? errorCount / recentAPIMetrics.length : 0
    
    // Top slow endpoints
    const endpointStats = new Map<string, { count: number, totalTime: number, errors: number }>()
    
    recentAPIMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0, errors: 0 }
      
      existing.count++
      existing.totalTime += metric.responseTime
      if (metric.statusCode >= 400) existing.errors++
      
      endpointStats.set(key, existing)
    })
    
    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        requestCount: stats.count,
        errorRate: stats.errors / stats.count
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10)
    
    return {
      systemMetrics: {
        avgMemoryUsage: Math.round(avgMemoryUsage * 100),
        currentMemoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        uptime: Math.round((Date.now() - this.startTime.getTime()) / 1000)
      },
      apiMetrics: {
        totalRequests: recentAPIMetrics.length,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 1000) / 10, // Round to 1 decimal
        errorCount
      },
      topSlowEndpoints,
      summary: {
        status: this.getOverallStatus(),
        lastUpdated: new Date().toISOString()
      }
    }
  }
  
  // Alert system
  checkAlerts(): string[] {
    const alerts: string[] = []
    const currentMetric = this.metrics[this.metrics.length - 1]
    
    if (!currentMetric) return alerts
    
    // Memory alerts
    const memoryUsage = currentMetric.memoryUsage.heapUsed / currentMetric.memoryUsage.heapTotal
    if (memoryUsage > this.thresholds.memoryUsage) {
      alerts.push(`High memory usage: ${Math.round(memoryUsage * 100)}%`)
    }
    
    // Response time alerts
    if (currentMetric.responseTime > this.thresholds.responseTime) {
      alerts.push(`High response time: ${currentMetric.responseTime}ms`)
    }
    
    // Error rate alerts
    if (currentMetric.errorRate > this.thresholds.errorRate) {
      alerts.push(`High error rate: ${Math.round(currentMetric.errorRate * 100)}%`)
    }
    
    return alerts
  }
  
  // Private helper methods
  private getActiveConnections(): number {
    // This would typically come from your connection pool
    // For now, return a placeholder based on recent API calls
    const recentCalls = this.apiMetrics.filter(m => 
      Date.now() - m.timestamp.getTime() < 60000 // Last minute
    )
    return new Set(recentCalls.map(m => m.clientId)).size
  }
  
  private getAverageResponseTime(): number {
    const recentMetrics = this.apiMetrics.slice(-100)
    if (recentMetrics.length === 0) return 0
    
    return recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
  }
  
  private getErrorRate(): number {
    const recentMetrics = this.apiMetrics.slice(-100)
    if (recentMetrics.length === 0) return 0
    
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    return errorCount / recentMetrics.length
  }
  
  private getOverallStatus(): 'healthy' | 'warning' | 'critical' {
    const currentMetric = this.metrics[this.metrics.length - 1]
    if (!currentMetric) return 'healthy'
    
    const memoryUsage = currentMetric.memoryUsage.heapUsed / currentMetric.memoryUsage.heapTotal
    const responseTime = currentMetric.responseTime
    const errorRate = currentMetric.errorRate
    
    if (
      memoryUsage > this.thresholds.memoryUsage ||
      responseTime > this.thresholds.responseTime ||
      errorRate > this.thresholds.errorRate
    ) {
      return 'critical'
    }
    
    if (
      memoryUsage > 0.7 ||
      responseTime > 1000 ||
      errorRate > 0.02
    ) {
      return 'warning'
    }
    
    return 'healthy'
  }
  
  // Cleanup old metrics (call periodically)
  cleanup() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime)
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp.getTime() > cutoffTime)
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Auto cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup()
  }, 60 * 60 * 1000) // 1 hour
}

export default performanceMonitor