"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { BrandSlug, DeviceCategory } from "@prisma/client";
import { slugify } from "@/lib/slugify";

const CreateChipsetSchema = z.object({
  brandSlug: z.nativeEnum(BrandSlug),
  name: z.string().min(1),
  series: z.string().min(1),
  releaseYear: z.coerce.number().int().min(2015).max(2035),
  processNode: z.string().min(1),
  cpuSummary: z.string().min(1),
  gpuSummary: z.string().min(1),
  npuSummary: z.string().optional(),
  maxRam: z.string().optional(),
  highlight: z.string().min(1),
  gradientFrom: z.string().min(1),
  gradientTo: z.string().min(1),
  sourceNote: z.string().min(1),
});

async function uniqueChipsetSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.chipset.findUnique({ where: { slug } })) {
    n++;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function uniqueDeviceSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.device.findUnique({ where: { slug } })) {
    n++;
    slug = `${base}-${n}`;
  }
  return slug;
}

export type CreateChipsetState = { error?: string; success?: boolean };

export async function createChipset(
  _prev: CreateChipsetState,
  formData: FormData
): Promise<CreateChipsetState> {
  await requireAdmin();

  const parsed = CreateChipsetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { brandSlug, ...chipsetData } = parsed.data;
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) return { error: "Unknown brand" };

  const slug = await uniqueChipsetSlug(`${brandSlug}-${slugify(chipsetData.name)}`);

  await prisma.chipset.create({
    data: { ...chipsetData, slug, brandId: brand.id },
  });

  revalidatePath("/");
  revalidatePath("/admin/chipsets");
  return { success: true };
}

const AddDeviceSchema = z.object({
  chipsetId: z.string().min(1),
  name: z.string().min(1),
  category: z.nativeEnum(DeviceCategory),
  releaseDate: z.string().min(1),
});

export type AddDeviceState = { error?: string; success?: boolean };

export async function addDevice(
  _prev: AddDeviceState,
  formData: FormData
): Promise<AddDeviceState> {
  await requireAdmin();

  const parsed = AddDeviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = await uniqueDeviceSlug(slugify(parsed.data.name));

  await prisma.device.create({
    data: {
      slug,
      chipsetId: parsed.data.chipsetId,
      name: parsed.data.name,
      category: parsed.data.category,
      releaseDate: new Date(parsed.data.releaseDate),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/chipsets");
  return { success: true };
}
