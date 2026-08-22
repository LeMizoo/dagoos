/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://dagoos-api.onrender.com/api/:path*',
      },
      {
        source: '/api/auth/:path*',
        destination: 'https://dagoos-api.onrender.com/api/auth/:path*',
      },
      {
        source: '/api/departs/:path*',
        destination: 'https://dagoos-api.onrender.com/api/departs/:path*',
      },
      {
        source: '/api/reservations/:path*',
        destination: 'https://dagoos-api.onrender.com/api/reservations/:path*',
      },
      {
        source: '/api/finances/:path*',
        destination: 'https://dagoos-api.onrender.com/api/finances/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://dagoos-api.onrender.com/api/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
