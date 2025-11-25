# Hooks Directory

## Overview
This directory contains custom React hooks that encapsulate reusable logic. Hooks provide a clean way to share stateful logic between components without changing component hierarchy.

## Available Hooks

### `use-mobile.tsx`
Detects if the user is on a mobile device based on viewport width.

**Purpose:**
Provides responsive behavior by detecting screen size changes and returning a boolean indicating mobile status.

**Usage:**
```tsx
import { useMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useMobile()
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  )
}
```

**Features:**
- Uses matchMedia API for accurate detection
- Listens to window resize events
- Breakpoint: 768px (standard mobile/tablet cutoff)
- Returns boolean value
- Handles SSR (Server-Side Rendering) safely

**Implementation Details:**
```tsx
const isMobile = useMobile()
// Returns true if viewport width < 768px
// Returns false if viewport width >= 768px
```

**Common Use Cases:**
- Show/hide navigation menus
- Render different layouts
- Adjust component behavior
- Control modal presentations
- Optimize touch interactions

**Performance Notes:**
- Debounces resize events
- Cleans up listeners on unmount
- Minimal re-renders

### `use-toast.ts`
Manages toast notifications throughout the application.

**Purpose:**
Provides a simple API for showing temporary notification messages to users.

**Usage:**
```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Your changes have been saved.",
      variant: "default"
    })
  }
  
  const handleError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive"
    })
  }
  
  return <button onClick={handleSuccess}>Save</button>
}
```

**Toast Options:**
```typescript
interface ToastOptions {
  title?: string              // Main message
  description?: string        // Additional details
  variant?: 'default' | 'destructive'  // Style variant
  duration?: number          // Auto-dismiss time (ms)
  action?: ReactNode         // Optional action button
}
```

**Variants:**
- `default` - Standard informational toast (blue theme)
- `destructive` - Error or warning toast (red theme)

**Features:**
- Auto-dismiss after duration
- Stack multiple toasts
- Manual dismiss option
- Action buttons support
- Accessible (ARIA labels)
- Customizable position

**Best Practices:**
```tsx
// Success messages
toast({
  title: "Profile updated",
  description: "Your changes have been saved successfully."
})

// Error messages
toast({
  title: "Failed to save",
  description: "Please try again later.",
  variant: "destructive"
})

// With action
toast({
  title: "Application submitted",
  description: "Track your application status in the dashboard.",
  action: <Button onClick={() => router.push('/applications')}>View</Button>
})

// Custom duration
toast({
  title: "Quick message",
  duration: 2000  // 2 seconds
})
```

## Creating Custom Hooks

### Hook Guidelines

When creating new hooks:

1. **Naming Convention**
   - Prefix with `use`: `useMyHook`
   - Use camelCase: `useFormValidation`
   - Be descriptive: `useDebounce` not `useD`

2. **File Structure**
   ```tsx
   // use-example.ts
   import { useState, useEffect } from 'react'
   
   export function useExample() {
     // Hook logic
     return value
   }
   ```

3. **TypeScript**
   - Always type return values
   - Type parameters
   - Export types if needed

4. **Documentation**
   - Add JSDoc comments
   - Include usage examples
   - Document parameters

### Common Hook Patterns

#### State Management Hook
```tsx
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  const reset = () => setCount(initialValue)
  
  return { count, increment, decrement, reset }
}
```

#### Effect Hook
```tsx
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = 'Campus Portal'  // Cleanup
    }
  }, [title])
}
```

#### Data Fetching Hook
```tsx
export function useStudent(id: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchStudent(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [id])
  
  return { data, loading, error }
}
```

#### Event Listener Hook
```tsx
export function useKeyPress(targetKey: string) {
  const [keyPressed, setKeyPressed] = useState(false)
  
  useEffect(() => {
    const downHandler = ({ key }) => {
      if (key === targetKey) setKeyPressed(true)
    }
    
    const upHandler = ({ key }) => {
      if (key === targetKey) setKeyPressed(false)
    }
    
    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)
    
    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [targetKey])
  
  return keyPressed
}
```

## Hook Best Practices

### Rules of Hooks

1. **Only call at top level**
   ```tsx
   // Good
   function Component() {
     const value = useHook()
     return <div />
   }
   
   // Bad - conditional
   function Component() {
     if (condition) {
       const value = useHook()  // Error!
     }
   }
   ```

2. **Only call from React functions**
   - React components
   - Custom hooks
   - Not regular JavaScript functions

3. **Use ESLint plugin**
   ```bash
   npm install eslint-plugin-react-hooks
   ```

### Performance Optimization

#### Memoization
```tsx
export function useExpensiveCalculation(data: any[]) {
  return useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])
}
```

#### Callback Memoization
```tsx
export function useEventCallback(callback: Function) {
  return useCallback(() => {
    callback()
  }, [callback])
}
```

#### Debouncing
```tsx
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}
```

### Error Handling

```tsx
export function useSafeAsync<T>(
  asyncFunction: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  
  const execute = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFunction()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  return { data, error, loading, execute }
}
```

## Testing Hooks

### Using React Testing Library

```tsx
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './use-counter'

test('should increment counter', () => {
  const { result } = renderHook(() => useCounter())
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

### Mocking Context

```tsx
const wrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
)

const { result } = renderHook(() => useAuth(), { wrapper })
```

## Common Hook Use Cases

### Form Handling
```tsx
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  
  const handleChange = (e) => {
    setValues({
      ...values,
      [e.target.name]: e.target.value
    })
  }
  
  return { values, handleChange }
}
```

### Local Storage
```tsx
export function useLocalStorage(key: string, initialValue: any) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : initialValue
  })
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  
  return [value, setValue]
}
```

### Previous Value
```tsx
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  }, [value])
  
  return ref.current
}
```

### Window Size
```tsx
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return size
}
```

## Integration with Existing Code

Hooks work seamlessly with:
- Context providers (useAuth, useTheme)
- Component state
- API calls
- External libraries

Example combining multiple hooks:
```tsx
function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isMobile = useMobile()
  const [data, setData] = useState(null)
  
  const handleSave = async () => {
    try {
      await saveProfile(data)
      toast({ title: "Saved successfully" })
    } catch (error) {
      toast({ 
        title: "Error", 
        variant: "destructive" 
      })
    }
  }
  
  return isMobile ? <MobileProfile /> : <DesktopProfile />
}
```

## Future Hook Ideas

Potential hooks to implement:
- `useDebounce` - Debounce values
- `useAsync` - Async operation handling
- `useLocalStorage` - Persistent state
- `useOnClickOutside` - Detect outside clicks
- `useIntersectionObserver` - Lazy loading
- `useKeyboard` - Keyboard shortcuts
- `useClipboard` - Copy to clipboard
- `useMediaQuery` - Media query matching
