# Shared Components

Reusable components used across the application.

## Components

### Header

Navigation header with logo, navigation links, user menu dropdown, and responsive mobile menu.

**Props:**
- `user?: { name?: string | null; email?: string | null; image?: string | null }` - User information
- `onLogout?: () => void` - Logout callback function

**Features:**
- Logo with link to home
- Desktop navigation links (Dashboard, Detect, Admin)
- User dropdown menu with settings and logout
- Responsive mobile menu
- Active link highlighting

**Usage:**
```tsx
import { Header } from "@/components/shared";

<Header 
  user={{ name: "John Doe", email: "john@example.com" }}
  onLogout={() => console.log("Logout")}
/>
```

---

### Sidebar

Collapsible sidebar navigation with icons and active state styling.

**Props:**
- `className?: string` - Additional CSS classes

**Features:**
- Navigation items: Dashboard, Detect, Admin
- Icons from lucide-react
- Active state highlighting
- Collapsible with toggle button
- Smooth transitions

**Usage:**
```tsx
import { Sidebar } from "@/components/shared";

<Sidebar className="h-screen" />
```

---

### LoadingSpinner

Animated loading spinner with optional text and size variants.

**Props:**
- `text?: string` - Optional loading text
- `size?: "sm" | "md" | "lg"` - Spinner size (default: "md")
- `className?: string` - Additional CSS classes

**Sizes:**
- `sm`: 16px (h-4 w-4)
- `md`: 32px (h-8 w-8)
- `lg`: 48px (h-12 w-12)

**Usage:**
```tsx
import { LoadingSpinner } from "@/components/shared";

<LoadingSpinner />
<LoadingSpinner text="Loading data..." size="lg" />
<LoadingSpinner text="Please wait" size="sm" />
```

---

### ErrorBoundary

React error boundary wrapper with fallback UI and reset functionality.

**Props:**
- `children: ReactNode` - Child components to wrap
- `fallback?: ReactNode` - Custom fallback UI (optional)
- `onReset?: () => void` - Reset callback function

**Features:**
- Catches React component errors
- Displays error message
- Try Again button to reset error state
- Reload Page button
- Custom fallback UI support
- Console error logging

**Usage:**
```tsx
import { ErrorBoundary } from "@/components/shared";

<ErrorBoundary onReset={() => console.log("Reset")}>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<div>Custom error UI</div>}>
  <YourComponent />
</ErrorBoundary>
```

---

## Import All Components

```tsx
import { Header, Sidebar, LoadingSpinner, ErrorBoundary } from "@/components/shared";
```

## Notes

- All components use Tailwind CSS for styling
- Components integrate with shadcn/ui components
- Icons from lucide-react
- Fully typed with TypeScript
- Responsive and accessible
