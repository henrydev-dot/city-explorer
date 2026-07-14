/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output → minimal Docker image for Dokploy/self-hosting.
  output: 'standalone',
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
};

export default nextConfig;
