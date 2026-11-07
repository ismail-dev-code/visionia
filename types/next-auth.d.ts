import type { DefaultSession } from "next-auth";

type AuthRole = "ADMIN" | "CUSTOMER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AuthRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AuthRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AuthRole;
  }
}
