import { escape } from "querystring"

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true, // This must be true for App Router
  },
  eslint:{
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig