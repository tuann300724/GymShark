import path from 'node:path';
import { createRequire } from 'node:module';
import withBundleAnalyzer from '@next/bundle-analyzer';

const require = createRequire(import.meta.url);

/**
 * @vladmandic/human: gói `exports` của package không xuất subpath `./dist/*`
 * (các key `dist/*` trong exports là *condition*, không phải subpath) và condition
 * `node` đứng đầu map → build bản server resolve human.node.js
 * (→ require('@tensorflow/tfjs-node') chưa cài → build fail).
 * Alias thẳng tới bản ESM/browser — file chỉ nằm trong chunk async, server không evaluate.
 */
const humanEsm = path.join(path.dirname(require.resolve('@vladmandic/human')), 'human.esm.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatar.vercel.sh' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@vladmandic/human/dist/human.esm.js'] = humanEsm;
    return config;
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
