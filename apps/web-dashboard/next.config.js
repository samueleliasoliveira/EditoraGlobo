/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverActions: {
    allowedOrigins: ["*"],
  },
};

module.exports = nextConfig;
