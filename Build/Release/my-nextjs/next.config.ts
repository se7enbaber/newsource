import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        allowedDevOrigins: ['192.168.100.245:3000', 'localhost:3000']
    }
} as any;

export default nextConfig;
