/** @type {import('next').NextConfig} */
const nextConfig = {
  // 确保环境变量能被前端访问
  env: {
    NEXT_PUBLIC_SILICONFLOW_API_KEY: process.env.NEXT_PUBLIC_SILICONFLOW_API_KEY,
  },
  // 关闭严格模式，避免开发时的双重渲染
  reactStrictMode: false,
  images: {
    domains: ['localhost'],
  },
  // 设置实验性功能
  experimental: {
    appDocumentPreloading: false,
  },
};

export default nextConfig;
