/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E runs its own Next server while local development may still be running.
  // A separate output folder prevents the two processes from corrupting `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
