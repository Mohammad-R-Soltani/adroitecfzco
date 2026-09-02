/// Explicit product-line definitions for the generational-uplift view.
///
/// These are declared by hand rather than parsed out of device names: model
/// naming is inconsistent across brands (Xiaomi skipped "16" entirely, Samsung
/// mixes Ultra/Plus tiers), and a wrong auto-grouping would silently compare
/// two devices that were never successive generations of the same thing.
/// Each entry lists device slugs in release order, oldest first.
export type ProductLine = {
  id: string;
  label: string;
  brandSlug: string;
  deviceSlugs: string[];
};

export const PRODUCT_LINES: ProductLine[] = [
  {
    id: "iphone-pro-max",
    label: "iPhone Pro Max",
    brandSlug: "apple",
    deviceSlugs: ["iphone-15-pro-max", "iphone-16-pro-max", "iphone-17-pro-max"],
  },
  {
    id: "iphone-base",
    label: "iPhone (base)",
    brandSlug: "apple",
    deviceSlugs: ["iphone-15", "iphone-16", "iphone-17"],
  },
  {
    id: "iphone-pro",
    label: "iPhone Pro",
    brandSlug: "apple",
    deviceSlugs: ["iphone-16-pro", "iphone-17-pro"],
  },
  {
    id: "galaxy-s-ultra",
    label: "Galaxy S Ultra",
    brandSlug: "samsung",
    deviceSlugs: ["galaxy-s24-ultra", "galaxy-s25-ultra"],
  },
  {
    id: "xiaomi-flagship",
    label: "Xiaomi flagship",
    brandSlug: "xiaomi",
    deviceSlugs: ["xiaomi-14", "xiaomi-15", "xiaomi-17"],
  },
  {
    id: "xiaomi-ultra",
    label: "Xiaomi Ultra",
    brandSlug: "xiaomi",
    deviceSlugs: ["xiaomi-14-ultra", "xiaomi-15-ultra"],
  },
];
