import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fdn.gsmarena.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.apple.com",
        pathname: "/**",
      },
    ],
    // Wikimedia rate-limits bulk server-side fetches from a single IP (used
    // by Next's image optimizer). Images are already served pre-sized from
    // their CDN, so let browsers fetch them directly instead.
    unoptimized: true,
  },
};

export default nextConfig;
