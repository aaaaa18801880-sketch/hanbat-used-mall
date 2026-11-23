import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(process.cwd());
const isDev = process.env.NODE_ENV !== "production";

function resolveSupabaseHost(): {
  origin: string;
  wsOrigin: string;
  hostname: string;
} {
  const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:" && parsed.hostname) {
      return {
        origin: parsed.origin,
        wsOrigin: `wss://${parsed.hostname}`,
        hostname: parsed.hostname,
      };
    }
  } catch {
    // 정적 빌드/환경변수 미주입 시 안전 폴백
  }
  return {
    origin: "https://*.supabase.co",
    wsOrigin: "wss://*.supabase.co",
    hostname: "**.supabase.co",
  };
}

const supabaseHost = resolveSupabaseHost();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  `img-src 'self' data: blob: ${supabaseHost.origin} https://hanbatmall.com https://www.google-analytics.com https://www.googletagmanager.com`,
  `connect-src 'self' ${supabaseHost.origin} ${supabaseHost.wsOrigin} https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://www.googletagmanager.com https://cdn.jsdelivr.net`,
  "frame-src 'self' https://maps.google.com https://www.google.com",
  isDev
    ? "frame-ancestors *; base-uri 'self'; object-src 'none'; form-action 'self'"
    : "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(), microphone=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    qualities: [70, 75, 80, 85, 90],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost.hostname,
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "hanbatmall.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
