import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

type AuthRole = "ADMIN" | "CUSTOMER";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "Visionia Customer",
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const extendedToken = token as typeof token & {
        userId?: string;
        role?: AuthRole;
      };

      if (user) {
        extendedToken.userId = user.id;
        extendedToken.role = user.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
      }

      return extendedToken;
    },
    async session({ session, token }) {
      const extendedToken = token as typeof token & {
        userId?: string;
        role?: AuthRole;
      };

      if (session.user) {
        session.user.id = extendedToken.userId ?? "";
        session.user.role = extendedToken.role ?? "CUSTOMER";
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
