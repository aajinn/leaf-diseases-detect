import { getServerSession as nextGetServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';

/**
 * Get the current session on the server side
 */
export async function getServerSession(): Promise<Session | null> {
  return await nextGetServerSession(authOptions);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Require admin role - redirect if not admin
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (!session.user.is_admin) {
    redirect('/dashboard');
  }

  return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return !!session;
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return !!session?.user.is_admin;
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Get access token from session
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession();
  return session?.accessToken || null;
}

/**
 * Middleware helper to check authentication
 */
export function withAuth(handler: (session: Session) => Promise<Response>) {
  return async () => {
    const session = await getServerSession();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(session);
  };
}

/**
 * Middleware helper to check admin role
 */
export function withAdmin(handler: (session: Session) => Promise<Response>) {
  return async () => {
    const session = await getServerSession();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!session.user.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(session);
  };
}
