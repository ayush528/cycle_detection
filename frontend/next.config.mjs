/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://cycle-detection.onrender.com'
        : 'http://localhost:3001');
    return [
      {
        source: '/bfhl',
        destination: `${backendUrl}/bfhl`,
      },
    ];
  },
};

export default nextConfig;
