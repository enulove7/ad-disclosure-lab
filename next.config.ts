import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v1은 모든 페이지가 동적(쿠키·DB 의존)이라 Cache Components를 끈 단순 모델을 사용
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
