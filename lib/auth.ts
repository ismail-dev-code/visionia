/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

type AuthRole = "ADMIN" | "CUSTOMER";

type JwtToken = {
  userId?: string;
  role?: AuthRole;
  [key: string]: unknown;
};

type SessionUser = {
  id?: string;
  role?: AuthRole;
};

export const authOptions = {
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
    async jwt({ token, user }: { token: JwtToken; user?: { id?: string; role?: AuthRole } }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role as AuthRole;
      }

      return token;
    },
    async session({ session, token }: { session: { user?: SessionUser }; token: JwtToken }) {
      if (session.user) {
        session.user.id = token.userId ?? "";
        session.user.role = (token.role ?? "CUSTOMER") as AuthRole;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions as any);
