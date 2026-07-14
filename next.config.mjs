/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output → minimal Docker image for Dokploy/self-hosting.
  output: 'standalone',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  async headers() {
    return [
      {
        // The ~12MB city model (gzip → ~4MB on the wire) never changes for a
        // given filename: cache it hard so repeat visits load instantly.
        // If you swap the map, rename the file (or add ?v=2 in CityScene).
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
