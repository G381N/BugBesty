import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log(`Attempting to authenticate user with email: ${credentials.email}`);
          
          // Use Firebase Authentication
          const userCredential = await signInWithEmailAndPassword(
            auth, 
            credentials.email, 
            credentials.password
          );
          
          const user = userCredential.user;
          
          if (!user) {
            console.log("No user found");
            return null;
          }

          console.log("Authentication successful for user:", {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          });
          
          // Return user object with essential data
          return {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          };
        } catch (error: any) {
          console.error("Authentication error:", error.message);
          return null;
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true", 
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback:', { 
        tokenHasId: !!token.id, 
        userProvided: !!user,
        userId: user?.id || token.id || 'none'
      });
      
      if (user) {
        // Pass the Firebase user ID to the token
        token.id = user.id;
        console.log('Updated token with user ID:', user.id);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback:', { 
        sessionUserExists: !!session.user,
        tokenHasId: !!token.id,
        tokenId: token.id || 'none'
      });
      
      if (token && session.user) {
        // Pass the Firebase user ID from token to session
        session.user.id = token.id as string;
        console.log('Set session user ID to:', session.user.id);
      } else {
        console.log('Could not set session user ID from token');
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure all redirects work properly on Render
      if (url.startsWith('/')) {
        // For relative URLs, make them absolute using baseUrl
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        // If it's already an absolute URL with our origin, return it as is
        return url;
      }
      // For all other cases, redirect to the base URL
      return baseUrl;
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 