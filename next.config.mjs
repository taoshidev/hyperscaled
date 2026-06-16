import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    USE_TESTNET: process.env.USE_TESTNET || "false",
  },
  // Don't fail the production build on ESLint findings — run lint as its own
  // CI step (`pnpm lint`) instead. `development` currently carries pre-existing
  // lint errors (react-hooks/set-state-in-effect + react-compiler memoization in
  // the campaign/coupon/admin components, plus some no-unused-vars) that block
  // `next build` on Vercel. Re-enable once those are cleaned up.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep Node-only libs external so webpack doesn’t omit them from Vercel’s traced bundle.
  // lib/db dynamically imports Cloud SQL Connector when CLOUD_SQL_INSTANCE_CONNECTION_NAME is set.
  // Do not use outputFileTracingIncludes with '/*' here — it blows up every function’s trace
  // (hundreds of MB, invalid serverless packages on Vercel). Removing webpackIgnore on those
  // imports in lib/db + listing packages here is enough for NFT to trace them.
  serverExternalPackages: [
    "nodemailer",
    "@google-cloud/cloud-sql-connector",
    "google-auth-library",
  ],
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
    };
    if (isServer) {
      config.externals.push("@react-native-async-storage/async-storage");
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@react-native-async-storage/async-storage": false,
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "taoshi",

  project: "hyperscaled-ui",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js proxy (edge);
  // otherwise reporting of client-side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
