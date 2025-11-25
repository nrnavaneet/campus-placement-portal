# Components Directory

## Overview
This directory contains all reusable React components organized by functionality. Components follow the shadcn/ui design system and are built with TypeScript for type safety.

## Structure

### `/auth`
Authentication-related components.

- `login-form.tsx` - Complete login and registration form with tabs for students and admins
  - Email validation for college domain
  - Password visibility toggle
  - Forgot password functionality
  - Automatic redirect handling

### `/layout`
Layout components used across the application.

- `navbar.tsx` - Main navigation bar with role-based menu items
  - Responsive mobile menu
  - User profile dropdown
  - Theme toggle
  - Logout functionality

- `footer.tsx` - Site footer with links and information
  - Quick links
  - Contact information
  - Social media links

### `/student`
Student-specific components.

- `registration-form.tsx` - Multi-step registration form for new students
  - Personal information
  - Academic details
  - Resume upload
  - Form validation with Zod

### `/ui`
Reusable UI components based on shadcn/ui primitives.

#### Core Components
- `button.tsx` - Button with variants (default, destructive, outline, ghost)
- `input.tsx` - Text input with label support
- `textarea.tsx` - Multi-line text input
- `label.tsx` - Form field labels
- `card.tsx` - Card container with header, content, footer
- `badge.tsx` - Status badges with color variants
- `avatar.tsx` - User profile images with fallback

#### Form Components
- `form.tsx` - Form wrapper with react-hook-form integration
- `select.tsx` - Dropdown selection component
- `checkbox.tsx` - Checkbox with label
- `radio-group.tsx` - Radio button group
- `switch.tsx` - Toggle switch
- `slider.tsx` - Range slider input
- `calendar.tsx` - Date picker calendar

#### Layout Components
- `dialog.tsx` - Modal dialog overlay
- `sheet.tsx` - Slide-out panel (mobile drawer)
- `tabs.tsx` - Tabbed interface
- `accordion.tsx` - Collapsible sections
- `separator.tsx` - Visual divider line
- `scroll-area.tsx` - Custom scrollbar container

#### Feedback Components
- `alert.tsx` - Alert messages (info, warning, error)
- `alert-dialog.tsx` - Confirmation dialogs
- `toast.tsx` - Toast notification system
- `sonner.tsx` - Advanced toast notifications
- `progress.tsx` - Progress bar indicator
- `skeleton.tsx` - Loading placeholder

#### Navigation Components
- `dropdown-menu.tsx` - Dropdown menu with items
- `navigation-menu.tsx` - Main navigation menu
- `menubar.tsx` - Menu bar with multiple menus
- `context-menu.tsx` - Right-click context menu
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Page navigation controls

#### Data Display
- `table.tsx` - Data table component
- `chart.tsx` - Chart components with Recharts
- `tooltip.tsx` - Hover tooltips
- `hover-card.tsx` - Hover card with content
- `popover.tsx` - Popover overlay
- `carousel.tsx` - Image/content carousel

#### Utility Components
- `command.tsx` - Command palette (Cmd+K)
- `collapsible.tsx` - Collapsible content
- `resizable.tsx` - Resizable panels
- `aspect-ratio.tsx` - Maintain aspect ratio
- `toggle.tsx` - Toggle button
- `toggle-group.tsx` - Toggle button group

#### Custom Components
- `scroll-to-top.tsx` - Scroll to top button
- `use-mobile.tsx` - Mobile detection hook
- `use-toast.ts` - Toast notification hook

### Root Components

- `job-application-dialog.tsx` - Job application submission dialog
  - Form validation
  - File upload handling
  - Status tracking

- `resume-preview-dialog.tsx` - Resume preview and download
  - PDF viewer
  - Download functionality

- `theme-provider.tsx` - Theme context provider (light/dark mode)

- `mouse-trail.tsx` - Interactive mouse trail effect (decorative)

## Component Guidelines

### Creating New Components

1. Place in appropriate category folder
2. Use TypeScript for all props
3. Follow naming convention: `kebab-case.tsx`
4. Export as named export
5. Include JSDoc comments for complex components

Example:
```tsx
interface ButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

/**
 * Button component with multiple variants
 * @param variant - Visual style variant
 * @param size - Button size
 */
export function Button({ variant = "default", size = "md", children }: ButtonProps) {
  // Implementation
}
```

### Component Best Practices

1. **Single Responsibility**: Each component should do one thing well
2. **Composability**: Build complex UIs from simple components
3. **Type Safety**: Use TypeScript interfaces for props
4. **Accessibility**: Include ARIA labels and keyboard navigation
5. **Responsive Design**: Mobile-first approach with Tailwind
6. **Performance**: Use React.memo for expensive renders
7. **Error Handling**: Graceful degradation for errors

### Styling Conventions

- Use Tailwind CSS utility classes
- Follow the design system color palette
- Maintain consistent spacing scale
- Use CSS variables for theming
- Keep component styles scoped

### State Management

- Local state with useState for component-specific data
- Context for shared state (auth, theme)
- Server state with API calls
- Form state with react-hook-form

### Testing Considerations

- Components should be easily testable
- Separate business logic from presentation
- Use dependency injection for external services
- Mock external dependencies in tests

## Integration with shadcn/ui

This project uses shadcn/ui components which are:
- Copy-pasted into your project (not npm package)
- Fully customizable
- Built on Radix UI primitives
- Styled with Tailwind CSS

To add new shadcn components:
```bash
npx shadcn-ui@latest add [component-name]
```

## Dependencies

Key libraries used in components:
- `@radix-ui/*` - Accessible component primitives
- `class-variance-authority` - Component variants
- `clsx` - Conditional classes
- `tailwind-merge` - Merge Tailwind classes
- `lucide-react` - Icon library
- `react-hook-form` - Form handling
- `zod` - Schema validation
