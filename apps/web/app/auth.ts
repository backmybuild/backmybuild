// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const handlers = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          google_id: profile.sub, // Store Google ID explicitly
        };
      },
      // optionally limit to specific hosted domain:
      // authorization: { params: { hd: "yourcompany.com" } }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

export const auth = handlers.auth;
