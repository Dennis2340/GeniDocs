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
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubId: profile.id.toString(),
        };
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
          // Check if user exists with either email or GitHub ID
          const existingUserByEmail = user.email
            ? await prisma.user.findUnique({
                where: { email: user.email },
              })
            : null;

          const existingUserByGithubId = githubUser.id
            ? await prisma.user.findFirst({
                where: { githubId: githubUser.id.toString() },
              })
            : null;

          // If user exists with a different GitHub ID, update it
          if (existingUserByEmail && !existingUserByEmail.githubId) {
            await prisma.user.update({
              where: { id: existingUserByEmail.id },
              data: { githubId: githubUser.id.toString() },
            });
          }

          // If user exists with a different email, handle the conflict
          if (
            existingUserByGithubId &&
            existingUserByGithubId.email !== user.email
          ) {
            // Option 1: Update the email (if you want to keep GitHub ID as primary identifier)
            await prisma.user.update({
              where: { id: existingUserByGithubId.id },
              data: { email: user.email },
            });

            // Option 2: Block sign-in (uncomment if you want to prevent account linking)
            // console.error("Account conflict: GitHub ID exists with different email");
            // return false;
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // If using JWT strategy
        if (token) {
          session.user.id = token.sub;
          session.user.githubId = token.githubId;
          session.accessToken = token.accessToken;
        }
        // If using database strategy
        else if (user) {
          session.user.id = user.id;

          // Fetch full user data including organization
          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { organization: true },
          });

          if (fullUser) {
            session.user.githubId = fullUser.githubId as string;
            if (fullUser.organization) {
              session.user.organization = {
                id: fullUser.organization.id,
                name: fullUser.organization.name,
                slug: fullUser.organization.slug,
              };
            }
          }
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Add user ID and GitHub ID to the token if available
      if (user) {
        token.userId = user.id;

        if ("githubId" in user) {
          token.githubId = user.githubId;
        }
      }

      // Add access token to the JWT token if available
      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },
  },
  session: {
    strategy: "jwt", // Use JWT strategy for better session management
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
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
