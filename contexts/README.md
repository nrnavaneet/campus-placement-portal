# Contexts Directory

## Overview
This directory contains React Context providers for managing global application state. Contexts provide a way to share data across the component tree without prop drilling.

## Available Contexts

### Authentication Context (`auth-context.tsx`)

Manages user authentication state and provides authentication-related functions throughout the application.

#### Features
- User session management
- Login and logout functionality
- Student profile data loading
- Authentication state persistence
- Role-based access control

#### Provided Values
```typescript
{
  user: User | null                    // Current authenticated user
  studentData: StudentData | null      // Student profile information
  loading: boolean                     // Loading state during auth operations
  login: (email, password) => boolean  // Login function
  logout: () => void                   // Logout function
  resetPassword: (email) => void       // Password reset function
  updateStudentData: () => void        // Refresh student profile
}
```

#### Usage Example
```tsx
import { useAuth } from '@/contexts/auth-context'

function ProfilePage() {
  const { user, studentData, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <LoginPrompt />
  
  return <Profile data={studentData} />
}
```

#### Authentication Flow
1. User provides credentials
2. Supabase authentication validates
3. Student profile fetched from database
4. Context updates with user and profile data
5. Protected routes become accessible

#### Protected Routes
Components using `useAuth` automatically get:
- Current user information
- Student profile data
- Loading states
- Authentication actions

### Theme Context (`theme-context.tsx`)

Manages application theme (light/dark mode) with system preference detection.

#### Features
- Light and dark theme support
- System preference detection
- Theme persistence in localStorage
- Smooth theme transitions
- CSS variable updates

#### Provided Values
```typescript
{
  theme: 'light' | 'dark' | 'system'   // Current theme
  setTheme: (theme) => void            // Change theme
  actualTheme: 'light' | 'dark'        // Resolved theme (system preference applied)
}
```

#### Usage Example
```tsx
import { useTheme } from '@/contexts/theme-context'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  )
}
```

#### Theme Implementation
- Uses CSS variables for colors
- Tailwind dark mode class strategy
- Respects user's system preferences
- Persists choice across sessions

## Context Best Practices

### When to Use Context

Use context for:
- Global application state (auth, theme)
- Data needed by many components
- Avoiding prop drilling through multiple levels
- State that changes infrequently

Avoid context for:
- Frequently updating state (use local state)
- Performance-critical updates
- Simple parent-child communication

### Creating New Contexts

Follow this pattern:

```tsx
'use client'

import { createContext, useContext, useState } from 'react'

interface MyContextType {
  value: string
  setValue: (value: string) => void
}

const MyContext = createContext<MyContextType | undefined>(undefined)

export function MyProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('')
  
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  )
}

export function useMyContext() {
  const context = useContext(MyContext)
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider')
  }
  return context
}
```

### Performance Optimization

1. **Split Contexts**: Separate frequently and infrequently changing data
2. **Memoization**: Use useMemo for computed values
3. **Selective Updates**: Only update what changed
4. **Context Composition**: Nest providers strategically

Example:
```tsx
// Bad: Single context with all data
<AppContext.Provider value={{ user, theme, notifications, settings }}>

// Good: Separate contexts
<AuthProvider>
  <ThemeProvider>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>
```

### Error Handling

Always include error boundaries around context providers:

```tsx
function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## Integration Points

### With Next.js App Router

Contexts must be client components:
```tsx
'use client'  // Required for contexts in App Router
```

Wrap in root layout:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### With Supabase

Auth context integrates with Supabase:
- Uses Supabase Auth for authentication
- Fetches user data from database
- Manages session persistence
- Handles token refresh

### With Components

Components access contexts via hooks:
```tsx
// In any component
const { user, login, logout } = useAuth()
const { theme, setTheme } = useTheme()
```

## State Management Strategy

### Current Approach
- **Contexts**: Global state (auth, theme)
- **Local State**: Component-specific data
- **Server State**: API data fetching
- **URL State**: Routing parameters

### Future Considerations
For more complex state management needs, consider:
- Zustand for client state
- React Query for server state
- Jotai for atomic state
- Redux Toolkit for complex workflows

## Testing Contexts

Provide mock contexts for testing:

```tsx
// test-utils.tsx
export function AuthProviderMock({ children, value }) {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// component.test.tsx
render(
  <AuthProviderMock value={{ user: mockUser }}>
    <MyComponent />
  </AuthProviderMock>
)
```

## Common Patterns

### Loading States
```tsx
if (loading) return <LoadingSpinner />
```

### Conditional Rendering
```tsx
{user ? <Dashboard /> : <LoginPage />}
```

### Protected Components
```tsx
const { user } = useAuth()
if (!user) return <Redirect to="/login" />
```

### Theme-Aware Styling
```tsx
const { actualTheme } = useTheme()
const bgColor = actualTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
```
