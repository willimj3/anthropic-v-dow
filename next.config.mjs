import createMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx', 'md'],
  outputFileTracingRoot: __dirname,
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [rehypeSlug],
  },
});

export default withMDX(nextConfig);
