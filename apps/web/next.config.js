/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@quicktrip/shared'],
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig