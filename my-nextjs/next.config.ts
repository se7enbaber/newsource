import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    experimental: {
        serverActions: {
            allowedOrigins: ['192.168.100.245:3000', 'localhost:3000', 'localhost:3001', '172.23.48.1:3001']
        }
    }
} as any;

export default nextConfig;
