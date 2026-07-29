/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Оборачиваем бэкенд в same-origin прокси: фронтенд по умолчанию обращается
  // к /api/backend/*, что снимает вопрос CORS в любом окружении.
  // Прямое обращение к бэкенду включается через NEXT_PUBLIC_API_URL.
  async rewrites() {
    const api = process.env.API_INTERNAL_URL || "http://localhost:8000";
    return [{ source: "/api/backend/:path*", destination: `${api}/api/:path*` }];
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default nextConfig;
