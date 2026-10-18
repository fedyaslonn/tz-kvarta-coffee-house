import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // ESLint runs explicitly in the build script so Next 15 does not misread Flat Config as missing.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
