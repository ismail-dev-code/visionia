import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type VisioniaUserRole = "ADMIN" | "CUSTOMER";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    role: user.role as VisioniaUserRole,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuthenticatedUser();

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

export async function isAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}
