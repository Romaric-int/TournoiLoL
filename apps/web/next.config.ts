import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // icônes de profil League of Legends
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        // avatars Discord
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
};

export default nextConfig;
