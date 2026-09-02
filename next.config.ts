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
        hostname: "commons.wikimedia.org",
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
      {
      protocol: "https",
      hostname: "commons.wikimedia.org",
      pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/catalog",
        destination: "/devices",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;