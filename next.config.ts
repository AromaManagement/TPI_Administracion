import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Allow access from physical devices on the local network.
    // Update this IP if your router assigns a different address.
    allowedDevOrigins: ["192.168.1.38"],
};

export default nextConfig;
