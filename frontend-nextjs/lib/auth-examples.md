# NextAuth.js Setup - Usage Examples

## Server-Side Authentication

### In Server Components (App Router)

```typescript
import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth';

// Require authentication
export default async function DashboardPage() {
  const session = await requireAuth(); // Redirects to /login if not authenticated
  
  return <div>Welcome {session.user.username}</div>;
}

// Require admin role
export default async function AdminPage() {
  const session = await requireAdmin(); // Redirects if not admin
  
  return <div>Admin Dashboard</div>;
}

// Get current user (optional)
export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Please log in</div>;
  }
  
  return <div>Profile: {user.email}</div>;
}
```

### In API Routes

```typescript
import { withAuth, withAdmin } from '@/lib/auth';

// Protected API route
export const GET = withAuth(async (session) => {
  return Response.json({ user: session.user });
});

// Admin-only API route
export const POST = withAdmin(async (session) => {
  // Only admins can access this
  return Response.json({ message: 'Admin action completed' });
});
```

## Client-Side Authentication

### Using the useAuth Hook

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({
      username: 'user@example.com',
      password: 'password123',
    });
    
    if (result.success) {
      // Redirected to dashboard
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Using ProtectedRoute Component

```typescript
'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>
  );
}

// Admin-only route
export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div>Admin Content</div>
    </ProtectedRoute>
  );
}
```

### Using NextAuth Session Hook

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome {session?.user.username}</h1>
      <p>Email: {session?.user.email}</p>
      <p>Admin: {session?.user.is_admin ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Middleware Configuration

The middleware automatically protects routes based on the configuration in `middleware.ts`:

- **Protected Routes**: `/dashboard`, `/detection`, `/history`, `/profile`, `/settings`
- **Admin Routes**: `/admin`
- **Public Routes**: `/`, `/login`, `/register`, `/forgot-password`

Authenticated users are automatically redirected away from login/register pages.

## Environment Variables

Make sure these are set in `.env.local`:

```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Session Management

- Sessions use JWT strategy
- Tokens are stored in HTTP-only cookies
- Session expires after 30 days
- Automatic token refresh on API calls
