const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.0.212", "192.168.0.212:3000"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
