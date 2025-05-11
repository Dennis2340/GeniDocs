import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubId?: string;
      organization?: {
        id: string;
        name: string;
        slug: string;
      };
    };
    accessToken?: string;
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    githubId?: string;
    organizationId?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    sub: string;
    userId?: string;
    githubId?: string;
    accessToken?: string;
    organizationId?: string;
  }
}
