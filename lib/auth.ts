import { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";

// Create a new database connection pool.
// We are careful to only instantiate one pool and reuse it across the app.
const pool = new Pool({
  connectionString: process.env.KANBAN_DATABASE_URL,
});

export const authOptions: AuthOptions = {
  // Use the Postgres adapter to connect to our Neon database.
  adapter: PostgresAdapter(pool),
  // Add secret for production
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Configure Google OAuth provider.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Configure Email provider for passwordless login.
    EmailProvider({
      // For development, we log the sign-in link to the console.
      // In production, you would configure a real email service here.
      sendVerificationRequest({ identifier: email, url }) {
        console.log(`Sign-in link for ${email}: ${url}`);
      },
      from: "no-reply@example.com", // This is required but not used when overriding sendVerificationRequest.
    }),
  ],
  session: {
    // Use JSON Web Tokens for session management.
    strategy: "jwt",
  },
  callbacks: {
    // Add the user's ID to the session object, so we can access it in our components.
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    // We will create custom pages for these routes.
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request", // Used for email sign-in flow.
  },
};
