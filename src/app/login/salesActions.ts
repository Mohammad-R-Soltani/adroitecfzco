"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type SalesLoginState = {
  error?: string;
};

export async function salesLogin(
  _prevState: SalesLoginState,
  formData: FormData,
): Promise<SalesLoginState> {
  const parsed = LoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a username and password." };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return { error: "Invalid username or password." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Invalid username or password." };
  }

  // Correct credentials are not enough here — sales access is granted per
  // account. The wording is deliberately different from a failed password, so
  // a colleague who simply lacks the grant knows to ask for it rather than
  // retyping their password.
  if (!user.modules.includes("SALES")) {
    return { error: "This account does not have access to the sales module. Ask an administrator to grant it." };
  }

  await createSession(user.id, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect("/sales");
}
