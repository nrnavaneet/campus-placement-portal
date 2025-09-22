// Performance metrics endpoint for monitoring and debugging
import { NextRequest, NextResponse } from 'next/server'
import performanceMonitor from '@/lib/performance-monitor'
import { cacheManager } from '@/lib/cache-manager'
import { rateLimiter } from '@/lib/rate-limiter'
import { PerformanceMonitor } from '@/lib/supabase-optimized'

export async function GET(request: NextRequest) {
  try {
    // Check if request is from authorized source (basic security)
    const authHeader = request.headers.get('authorization')
    const isAuthorized = authHeader === `Bearer ${process.env.METRICS_API_KEY}` || 
                        process.env.NODE_ENV === 'development'
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get comprehensive performance data
    const performanceStats = performanceMonitor.getPerformanceStats()
    const cacheStats = cacheManager.getStats()
    const rateLimitStats = rateLimiter.getStats()
    const dbQueryStats = PerformanceMonitor.getAllStats()
    
    const response = {
      timestamp: new Date().toISOString(),
      system: performanceStats.systemMetrics,
      api: performanceStats.apiMetrics,
      topSlowEndpoints: performanceStats.topSlowEndpoints,
      cache: {
        hitRate: cacheStats.hitRate,
        totalItems: cacheStats.size,
        maxSize: cacheStats.maxSize,
        totalAccess: cacheStats.totalAccess,
        expiredCount: cacheStats.expiredCount
      },
      rateLimit: {
        totalEntries: rateLimitStats.totalEntries,
        blockedEntries: rateLimitStats.blockedEntries,
        blockRate: Math.round((rateLimitStats.blockedEntries / Math.max(rateLimitStats.totalEntries, 1)) * 1000) / 10,
        configs: Object.keys(rateLimitStats.configs).length
      },
      database: {
        queryStats: Object.entries(dbQueryStats).map(([operation, stats]) => ({
          operation,
          totalQueries: stats.count,
          avgTime: Math.round(stats.totalTime / Math.max(stats.count, 1)),
          minTime: stats.minTime,
          maxTime: stats.maxTime
        }))
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Metrics endpoint error:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Simple metrics endpoint that doesn't require authentication (for basic monitoring)
export async function HEAD(request: NextRequest) {
  try {
    const healthCheck = await performanceMonitor.performHealthCheck()
    
    // Return status in headers
    const headers = new Headers()
    headers.set('X-System-Status', healthCheck.status)
    headers.set('X-Uptime', healthCheck.uptime.toString())
    headers.set('X-Response-Time', healthCheck.metrics.responseTime.toString())
    headers.set('X-Error-Rate', (healthCheck.metrics.errorRate * 100).toFixed(1))
    
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'warning' ? 207 : 503
    
    return new NextResponse(null, { status: statusCode, headers })
    
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}