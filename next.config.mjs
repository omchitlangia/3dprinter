/** @type {import('next').NextConfig} */

// Security headers applied to every response. Tightened CSP would require nonces;
// this is a pragmatic baseline that still blocks the common attack classes.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inlines small runtime scripts; 'unsafe-inline' is required without nonces.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      // Decorative hero video is served same-origin from /public/hero.
      "media-src 'self'",
      "font-src 'self' data:",
      // Allow XHR/fetch to self + S3-compatible storage for presigned uploads.
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  // Required for the production Docker image: emits a self-contained server
  // bundle under .next/standalone. Added during server verification — MUST be
  // committed to the repo.
  output: "standalone",
  // Keep nodemailer as a true external server package. It lazy-loads transports
  // via dynamic require(), which the standalone file-tracer can't follow — so
  // without this it gets half-bundled and is MISSING from .next/standalone,
  // breaking all email at runtime. Listing it here makes Next copy the whole
  // package into the standalone node_modules instead.
  serverExternalPackages: ["nodemailer"],
  // Marketing media (hero poster, printer photo, gallery prints) is pre-sized and
  // web-optimized. Disable the Image Optimization pipeline: the standalone runtime
  // may not ship `sharp`, and since assets are already optimal this is zero-risk.
  // We still use next/image with explicit width/height for layout stability + lazy loading.
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
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
