// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

require("dotenv").config({
  path: "../../.env",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output:
    process.env.NEXT_PUBLIC_SELF_HOSTED === "true" ? "standalone" : undefined,
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "@rallly/database",
    "@rallly/icons",
    "@rallly/ui",
    "@rallly/tailwind-config",
    "@rallly/posthog",
    "@rallly/emails",
  ],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/support",
        destination: "https://support.rallly.co",
        permanent: true,
      },
      {
        source: "/profile",
        destination: "/settings/profile",
        permanent: true,
      },
      {
        source: "/auth/disable-notifications",
        destination: "/api/notifications/unsubscribe",
        permanent: true,
      },
    ];
  },
  experimental: {
    // necessary for server actions using aws-sdk
    serverComponentsExternalPackages: ["@aws-sdk"],
  },
};

// Only use Sentry in production
const config = process.env.NODE_ENV === 'development'
  ? withBundleAnalyzer(nextConfig)
  : require("@sentry/nextjs").withSentryConfig(
    withBundleAnalyzer(nextConfig),
    {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    }
  );

module.exports = config;
