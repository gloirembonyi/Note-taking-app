import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Here you would typically verify the credentials against your database
        // For demo purposes, we're using a simple check
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // In a real application, you would check against your user database
        if (credentials.email === "demo@example.com" && credentials.password === "password") {
          return {
            id: "1",
            name: "Demo User",
            email: "demo@example.com",
          };
        }

        // Return null if credentials are invalid
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub || "";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
}; 