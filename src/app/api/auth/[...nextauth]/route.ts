import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/utils/db";

console.log("Auth setup - environment check:", {
  hasGithubId: !!process.env.GITHUB_ID,
  hasGithubSecret: !!process.env.GITHUB_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
});

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in callback triggered", {
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        provider: account?.provider,
      });

      if (account?.provider === "github" && profile) {
        const githubUser = profile as any;
        console.log("GitHub profile data:", {
          id: githubUser.id,
          hasEmail: !!githubUser.email,
          hasName: !!githubUser.name,
        });

        try {
          // Update or create user with GitHub data
          const upsertResult = await prisma.user.upsert({
            where: {
              email: githubUser.email || user.email || "",
            },
            update: {
              name: githubUser.name || user.name,
              image: githubUser.avatar_url || user.image,
              githubId: githubUser.id?.toString(),
            },
            create: {
              name: githubUser.name || user.name || "GitHub User",
              email: githubUser.email || user.email || "",
              image: githubUser.avatar_url || user.image,
              githubId: githubUser.id?.toString(),
            },
          });

          console.log("User upsert successful", { userId: upsertResult.id });
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error(`Auth error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`Auth warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`Auth debug: ${code}`, metadata);
    },
  },
  //   pages: {
  //     signIn: "/auth/signin",
  //     error: "/auth/error",
  //   },
});

export { handler as GET, handler as POST };
