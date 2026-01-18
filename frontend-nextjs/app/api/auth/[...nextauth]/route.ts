import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import { User } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: User;
    accessToken: string;
  }

  interface User extends User {
    access_token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: User;
    accessToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password are required');
        }

        try {
          // Create FormData for OAuth2 password flow
          const formData = new URLSearchParams();
          formData.append('username', credentials.username);
          formData.append('password', credentials.password);

          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Authentication failed');
          }

          const data = await response.json();

          // Return user object with access token
          return {
            id: data.user.id,
            email: data.user.email,
            username: data.user.username,
            full_name: data.user.full_name,
            is_active: data.user.is_active,
            is_admin: data.user.is_admin,
            created_at: data.user.created_at,
            access_token: data.access_token,
          } as NextAuthUser;
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error instanceof Error ? error.message : 'Authentication failed');
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          is_active: user.is_active,
          is_admin: user.is_admin,
          created_at: user.created_at,
        } as User;
        token.accessToken = user.access_token;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.user = { ...token.user, ...session.user };
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      session.user = token.user as User;
      session.accessToken = token.accessToken as string;

      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
