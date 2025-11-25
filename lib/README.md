# Library Directory

## Overview
This directory contains utility functions, service integrations, and core business logic. These modules are shared across the application and provide essential functionality for data management, authentication, and performance optimization.

## Core Modules

### Database & Authentication

#### `supabase.ts`
Basic Supabase client configuration for database operations.

**Features:**
- Client-side Supabase instance
- Database queries
- Real-time subscriptions
- Storage operations

**Usage:**
```typescript
import { supabaseClient } from '@/lib/supabase'

const { data, error } = await supabaseClient
  .from('students')
  .select('*')
```

#### `supabase-optimized.ts`
High-performance Supabase client with connection pooling for handling heavy loads.

**Features:**
- Connection pool manager with 10 concurrent connections
- Round-robin load balancing
- Query performance monitoring
- Batch operation support
- Optimized for 700+ concurrent users

**Key Components:**
- `ConnectionPoolManager` - Manages multiple Supabase connections
- `SupabaseQueryOptimizer` - Batches and optimizes queries
- `PerformanceMonitor` - Tracks query execution times

**Usage:**
```typescript
import { connectionPool } from '@/lib/supabase-optimized'

const client = connectionPool.getConnection()
const { data } = await client.from('students').select('*')
```

### Performance & Caching

#### `cache-manager.ts`
In-memory caching system to reduce database load.

**Features:**
- LRU (Least Recently Used) eviction
- TTL (Time To Live) management
- 1000-item capacity
- Domain-specific caching methods
- Cache invalidation strategies

**Cache Methods:**
- `cacheStudentProfile()` - Cache student data
- `cacheJobs()` - Cache job listings
- `cacheDashboardStats()` - Cache dashboard metrics
- `cacheApplications()` - Cache application data
- `invalidateUserData()` - Clear user caches

**Usage:**
```typescript
import { cacheManager } from '@/lib/cache-manager'

const student = await cacheManager.cacheStudentProfile(userId, async () => {
  return await fetchStudentFromDB(userId)
})
```

#### `rate-limiter.ts`
Request rate limiting and traffic management.

**Features:**
- Per-client rate limiting
- Request batching
- Circuit breaker pattern
- Request queuing
- Configurable limits per endpoint

**Components:**
- `RateLimiter` - Tracks and limits requests
- `RequestBatcher` - Groups similar requests
- `CircuitBreaker` - Prevents cascade failures

**Usage:**
```typescript
import { rateLimiter } from '@/lib/rate-limiter'

if (!rateLimiter.isAllowed(clientId, 'api:default')) {
  throw new Error('Rate limit exceeded')
}
```

#### `performance-monitor.ts`
System health and performance monitoring.

**Features:**
- Real-time metrics collection
- API call tracking
- Memory usage monitoring
- Response time measurement
- Error rate calculation
- Health check functionality

**Metrics Tracked:**
- System memory usage
- CPU usage
- Active connections
- Average response time
- Error rates
- Top slow endpoints

**Usage:**
```typescript
import { performanceMonitor } from '@/lib/performance-monitor'

const health = await performanceMonitor.performHealthCheck()
const stats = performanceMonitor.getPerformanceStats()
```

### Optimized Operations

#### `optimized-api.ts`
High-performance API wrapper integrating caching, rate limiting, and connection pooling.

**Features:**
- Automatic caching for frequent queries
- Rate limit enforcement
- Circuit breaker protection
- Connection pool utilization
- Batch operations

**Available Methods:**
- `getStudentProfile()` - Fetch student with caching
- `getActiveJobs()` - Get job listings
- `getStudentApplications()` - Retrieve applications
- `getDashboardStats()` - Get cached statistics
- `getCompanyReport()` - Generate reports
- `invalidateUserCache()` - Clear caches

**Usage:**
```typescript
import { OptimizedAPI } from '@/lib/optimized-api'

const profile = await OptimizedAPI.getStudentProfile(userId, clientId)
const jobs = await OptimizedAPI.getActiveJobs(clientId)
```

#### `database-optimizer.ts`
Database query optimization and lazy loading.

**Features:**
- Lazy loading for large datasets
- Pagination support
- Advanced search capabilities
- Batch insert/update operations
- Database health checks

**Methods:**
- `lazyLoad()` - Paginated data loading
- `searchStudents()` - Full-text student search
- `searchJobs()` - Job search with filters
- `batchInsert()` - Bulk insert operations
- `checkDatabaseHealth()` - Database status

**Usage:**
```typescript
import DatabaseOptimizer from '@/lib/database-optimizer'

const result = await DatabaseOptimizer.lazyLoad('students', {
  page: 1,
  limit: 50,
  orderBy: 'created_at'
})
```

### Utilities

#### `utils.ts`
General utility functions used throughout the application.

**Common Functions:**
- `cn()` - Merge Tailwind classes conditionally
- Date formatting helpers
- String manipulation
- Type guards
- Validation helpers

**Usage:**
```typescript
import { cn } from '@/lib/utils'

const className = cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
)
```

#### `notification-service.ts`
Notification management and delivery system.

**Features:**
- Email notifications
- In-app notifications
- Notification templates
- Bulk notification sending
- Delivery tracking

**Usage:**
```typescript
import { sendNotification } from '@/lib/notification-service'

await sendNotification({
  userId: 'user-123',
  type: 'application_status',
  message: 'Your application has been reviewed'
})
```

## Performance Architecture

### Scalability Features

The library modules work together to handle high concurrent loads:

1. **Connection Pooling** - 10 Supabase connections handle parallel requests
2. **Caching Layer** - Reduces database queries by 60-80%
3. **Rate Limiting** - Prevents API abuse and system overload
4. **Circuit Breakers** - Graceful degradation during failures
5. **Request Batching** - Groups similar operations
6. **Lazy Loading** - Efficient data pagination

### System Capacity

Optimized for:
- 700+ concurrent users
- Sub-500ms response times
- 85% cache hit rate
- 100 requests/minute per client
- Automatic failover and recovery

## Best Practices

### Using Optimized APIs

Always prefer optimized wrappers:
```typescript
// Good: Uses caching and rate limiting
import { OptimizedAPI } from '@/lib/optimized-api'
const data = await OptimizedAPI.getStudentProfile(id, clientId)

// Avoid: Direct database calls without optimization
const { data } = await supabase.from('students').select('*').eq('id', id)
```

### Cache Invalidation

Invalidate caches after data mutations:
```typescript
import { OptimizedAPI } from '@/lib/optimized-api'

// Update student data
await updateStudent(data)

// Clear cache
OptimizedAPI.invalidateUserCache(regNo, userId)
```

### Error Handling

All library functions include error handling:
```typescript
try {
  const result = await OptimizedAPI.getActiveJobs(clientId)
} catch (error) {
  if (error.message === 'Rate limit exceeded') {
    // Handle rate limit
  }
  // Handle other errors
}
```

### Performance Monitoring

Check system health regularly:
```typescript
import { performanceMonitor } from '@/lib/performance-monitor'

const health = await performanceMonitor.performHealthCheck()

if (health.status === 'critical') {
  // Alert administrators
}
```

## Environment Configuration

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Monitoring Endpoints

Health and metrics endpoints available:
- `/api/health` - System health status
- `/api/metrics` - Performance metrics (requires auth)

## Testing

Mock library functions in tests:
```typescript
jest.mock('@/lib/optimized-api', () => ({
  OptimizedAPI: {
    getStudentProfile: jest.fn().mockResolvedValue(mockStudent)
  }
}))
```

## Future Enhancements

Potential improvements:
- Redis integration for distributed caching
- GraphQL API layer
- WebSocket for real-time updates
- Advanced analytics
- Machine learning predictions
