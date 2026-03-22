/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
    ];
    // Ignore optional peer dependencies from wagmi connectors
    config.resolve.alias = {
      ...config.resolve.alias,
      "porto/internal": false,
      "@metamask/sdk": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@walletconnect/ethereum-provider": false,
    };
    return config;
  },
};

module.exports = nextConfig;
