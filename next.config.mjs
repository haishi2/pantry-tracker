/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/pantry-tracker-3bc24.appspot.com/**",
      },
    ],
  },
};

export default nextConfig;
