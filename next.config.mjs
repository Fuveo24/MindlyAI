/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // youtubei.js is ESM-only — keep it as an external so Next.js doesn't
  // try to CJS-bundle it, which would break the ESM import chain.
  serverExternalPackages: ["youtubei.js"],
};

export default nextConfig;
