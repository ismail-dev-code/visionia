"use server";

import { hash } from "bcryptjs";

import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function registerUser(input: unknown) {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Validation failed.");
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("An account already exists for this email address.");
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  return { success: true };
}
