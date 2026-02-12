/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiBase =
      process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL ||
      process.env.NEXT_PUBLIC_ANALYSIS_API_URL;
    if (!apiBase) return [];
    const normalized = apiBase.replace(/\/+$/, "");
    return [
      {
        source: "/ncd/:path*",
        destination: `${normalized}/ncd/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };

    return config;
  },
};

export default nextConfig;
