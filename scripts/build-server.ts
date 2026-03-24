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
      outfile: join(__dirname, '../dist/server.js'),
      format: 'esm',
      external: [
        'better-sqlite3',
        'pg',
        'express',
        'dotenv',
        'bcryptjs',
        'jsonwebtoken',
        'framer-motion',
        'lucide-react',
        'react',
        'react-dom',
        '@google/genai'
      ],
      banner: {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
      },
    });
    console.log('✅ Server built successfully to dist/server.js');
  } catch (err) {
    console.error('❌ Server build failed:', err);
    process.exit(1);
  }
}

buildServer();
