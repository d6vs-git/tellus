import { createUser, findUserByEmail } from "@/db/user";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface User {
    id?: string;
    code?: string;
  }

  interface Session {
    user: {
      id?: string;
      code?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await findUserByEmail(user.email!);

          if (!existingUser) {
            // Create new user with generated code
            await createUser({
              email: user.email!,
              username: user.name!,
              code: Math.floor(Math.random() * 1000000).toString(),
            });
          }
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Add user code to session if needed
      if (session.user?.email) {
        try {
          const dbUser = await findUserByEmail(session.user.email);
          if (dbUser) {
            (session.user as any).code = dbUser.code;
            (session.user as any).id = dbUser.id;
          }
        } catch (error) {
          console.error("Error fetching user data for session:", error);
        }
      }
      return session;
    },
  },
  // Optional: Handle connection cleanup
  events: {
    async signOut() {
      // You can add cleanup logic here if needed
    },
  },
});

export { handler as GET, handler as POST };
