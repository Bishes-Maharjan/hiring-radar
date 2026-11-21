import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { verifyOwnerSignIn } from "@/lib/auth/oauth-check";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async signIn({ account, profile }) {
      const isAllowed = verifyOwnerSignIn(
        {
          provider: account?.provider,
          email: profile?.email,
          email_verified: profile?.email_verified,
        },
        process.env.OWNER_EMAIL,
      );

      return isAllowed;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email && session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
