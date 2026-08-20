"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";

const CreateUserSchema = z.object({
  username: z.string().min(3, "At least 3 characters").regex(/^[a-z0-9._-]+$/i, "Letters, numbers, dots, dashes only"),
  displayName: z.string().min(1, "Required"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type CreateUserState = { error?: string; success?: boolean };

export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = CreateUserSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, displayName, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return { error: "That username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, displayName, passwordHash, role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/admin/users");
}
