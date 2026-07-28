/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const api = process.env.API_INTERNAL_URL || "http://localhost:8000";
    return [{ source: "/api/backend/:path*", destination: `${api}/api/:path*` }];
  },
};
module.exports = nextConfig;
