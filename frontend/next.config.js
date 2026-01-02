/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Disable development indicators (e.g., the "N" button in bottom left corner)
  devIndicators: false,
  
  // Disable source maps in development to avoid "Unable to add filesystem: <illegal path>" error
  // This error occurs on Windows when Chrome DevTools tries to access absolute Windows paths
  // from source maps (e.g., C:\Users\...) which are not valid in browser context
  productionBrowserSourceMaps: false,
  
  // Configure webpack to avoid exposing absolute Windows paths in source maps
  // Using 'eval-source-map' which inlines source maps (no file paths) prevents the filesystem error
  // while still allowing debugging with source maps
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use 'eval-source-map' to inline source maps without exposing file paths
      // This prevents Windows absolute path issues in browser DevTools while maintaining debugging capability
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

module.exports = nextConfig;
