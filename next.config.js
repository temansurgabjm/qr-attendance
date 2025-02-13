/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disable SWC
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  output: "standalone", // Tambahkan ini
};

module.exports = nextConfig;
