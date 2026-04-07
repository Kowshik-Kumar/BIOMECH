/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid intermittent filesystem cache corruption in synced folders like OneDrive.
      config.cache = false;
    }

    return config;
  },
};

export default nextConfig;
