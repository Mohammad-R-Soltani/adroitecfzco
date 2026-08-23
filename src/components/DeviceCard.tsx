import Image from "next/image";
import Link from "next/link";

export type DeviceCardData = {
  slug: string;
  name: string;
  category: string;
  releaseDate: Date;
  imageUrl: string | null;
  chipset: { name: string; slug: string; gradientFrom: string; gradientTo: string };
};

export default function DeviceCard({ device }: { device: DeviceCardData }) {
  return (
    <Link
      href={`/devices/${device.slug}`}
      className="surface-card group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm transition hover:border-[var(--signal)]/40 hover:shadow-md"
    >
      {device.imageUrl ? (
        <>
          <Image
            src={device.imageUrl}
            alt={device.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(155deg, ${device.chipset.gradientFrom}, ${device.chipset.gradientTo})`,
          }}
        />
      )}

      <div className="relative z-10 p-3">
        <p className="truncate text-xs font-medium text-white/70">{device.chipset.name}</p>
        <p className="truncate text-sm font-semibold text-white">{device.name}</p>
      </div>
    </Link>
  );
}
