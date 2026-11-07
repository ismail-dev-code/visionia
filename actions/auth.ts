"use server";

import { Prisma } from "@prisma/client";
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
    return { success: true };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      return { success: true };
    }

    throw error;
  }

  return { success: true };
}
