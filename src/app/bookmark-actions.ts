"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";

export async function toggleBookmark(chipsetId: string) {
  const user = await requireUser();

  const existing = await prisma.bookmark.findUnique({
    where: { userId_chipsetId: { userId: user.id, chipsetId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId: user.id, chipsetId } });
  }

  revalidatePath("/");
  revalidatePath("/me");
}
