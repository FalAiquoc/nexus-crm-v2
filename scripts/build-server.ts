import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
  console.log('🚀 Building server...');
  
  try {
    await build({
      entryPoints: [join(__dirname, '../server.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: join(__dirname, '../dist/server.cjs'),
      format: 'cjs',
      external: [
        'pg',
        'express',
        'esbuild',
        'vite',
        'dotenv',
        'bcryptjs',
        'jsonwebtoken',
        'framer-motion',
        'lucide-react',
        'react',
        'react-dom',
        '@google/genai'
      ],
    });
    console.log('✅ Server built successfully to dist/server.cjs');
  } catch (err) {
    console.error('❌ Server build failed:', err);
    process.exit(1);
  }
}

buildServer();
