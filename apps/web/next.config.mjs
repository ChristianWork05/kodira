const nextConfig = {
  transpilePackages: ['@kodira/ui', '@kodira/hooks', '@kodira/api-client', '@kodira/types'],
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
