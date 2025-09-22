// Health check endpoint for monitoring system status
import { NextRequest, NextResponse } from 'next/server'
import performanceMonitor from '@/lib/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    // Perform comprehensive health check
    const healthCheck = await performanceMonitor.performHealthCheck()
    
    // Get additional system information
    const performanceStats = performanceMonitor.getPerformanceStats()
    const alerts = performanceMonitor.checkAlerts()
    
    // Determine HTTP status code based on health
    let statusCode = 200
    if (healthCheck.status === 'warning') {
      statusCode = 207 // Multi-Status
    } else if (healthCheck.status === 'critical') {
      statusCode = 503 // Service Unavailable
    }
    
    const response = {
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      uptime: healthCheck.uptime,
      checks: healthCheck.checks,
      metrics: {
        system: {
          memory: {
            used: Math.round(healthCheck.metrics.memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(healthCheck.metrics.memoryUsage.heapTotal / 1024 / 1024),
            usage: Math.round((healthCheck.metrics.memoryUsage.heapUsed / healthCheck.metrics.memoryUsage.heapTotal) * 100)
          },
          cpu: healthCheck.metrics.cpuUsage,
          activeConnections: healthCheck.metrics.activeConnections,
          responseTime: healthCheck.metrics.responseTime,
          errorRate: Math.round(healthCheck.metrics.errorRate * 1000) / 10
        },
        performance: performanceStats
      },
      alerts: alerts.length > 0 ? alerts : undefined,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(response, { status: statusCode })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}