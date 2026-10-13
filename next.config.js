/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/listen', destination: '/', permanent: true },
      { source: '/about', destination: '/pages/about', permanent: true },
      { source: '/committee', destination: '/pages/committee', permanent: true },
      { source: '/get-involved', destination: '/pages/get-involved', permanent: true },
      { source: '/competitions', destination: '/pages/competitions', permanent: true },
      { source: '/pages/committees/:year', destination: '/pages/committee', permanent: true },
      { source: '/competition-terms', destination: '/pages/competitions', permanent: true },
    ];
  },
};
