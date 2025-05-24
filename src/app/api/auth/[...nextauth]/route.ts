import { authOptions } from "@/utils/auth";
import NextAuth from "next-auth";

console.log("Auth setup - environment check:", {
  hasGithubId: !!process.env.GITHUB_ID,
  hasGithubSecret: !!process.env.GITHUB_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
});



const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
