/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json'
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig

