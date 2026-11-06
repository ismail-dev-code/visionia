"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

const emailSchema = z.string().trim().email().max(254);

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));
  if (!parsedEmail.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsedEmail.data.toLowerCase() },
    create: { email: parsedEmail.data.toLowerCase() },
    update: { isActive: true },
  });

  revalidatePath("/admin/newsletter");
  return { status: "success", message: "You're subscribed. Thank you!" };
}
