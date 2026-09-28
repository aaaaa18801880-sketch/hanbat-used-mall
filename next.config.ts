/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Supabase 스토리지 이미지 허용
      },
    ],
  },
};

export default nextConfig;