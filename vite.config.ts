import { defineConfig, normalizePath } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// ✅ 从统一配置读取开发端口
const DEV_PORT = parseInt(process.env.VITE_DEV_PORT || '3000');

const createConfig = (outDir: string) => ({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/*.wasm')),
          dest: './libs/',
        },
      ],
    }),
    react(),
  ],
  define: {
    // ✅ 防止在浏览器中意外访问 process
    'process.env': {},
    'global': 'globalThis',
    // ✅ 添加开发环境标识
    '__DEV__': JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  // ✅ 优化解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
      '~': path.resolve(__dirname, './src/renderer/src'),
    },
    // Deduplicate react to avoid multiple instances across chunks
    dedupe: ['react', 'react-dom'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  root: path.join(__dirname, 'src/renderer'),
  publicDir: path.join(__dirname, 'src/renderer/public'),
  base: './',
  // ✅ 优化开发服务器配置
  server: {
    port: DEV_PORT,
    host: true, // 允许外部访问
    cors: true,
    // ✅ 优化 HMR
    hmr: {
      overlay: true,
      clientPort: DEV_PORT,
    },
    // ✅ 本地开发代理到后端（WS/静态/API/媒体）
    proxy: {
      '/client-ws': {
        target: 'ws://127.0.0.1:12393',
        ws: true,
        changeOrigin: true,
      },
      '/tts-ws': {
        target: 'ws://127.0.0.1:12393',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/ads': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/videos': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/web-tool': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/cache': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/live2d-models': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/avatars': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
      '/bg': {
        target: 'http://127.0.0.1:12393',
        changeOrigin: true,
      },
    },
    // ✅ 监听文件变化
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  // ✅ 优化构建配置
  build: {
    outDir: path.join(__dirname, outDir),
    emptyOutDir: true,
    assetsDir: 'assets',
    // ✅ 优化构建性能
    target: 'esnext',
    // Use esbuild minifier to avoid edge cases that may appear with terser in ESM chunk order
    minify: 'esbuild' as const,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        main: path.join(__dirname, 'src/renderer/index.html'),
      },
      // Let Vite/Rollup handle chunking to ensure correct execution order of ESM modules
    },
    // Relax warning threshold (purely informational)
    chunkSizeWarningLimit: 2000,
  },
  // ✅ 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@chakra-ui/react',
      '@emotion/react',
      '@ricky0123/vad-web',
    ],
  },
  // 暂时注释掉 ssr 配置以避免 vite-plugin-static-copy 引用
  // ssr: {
  //   noExternal: ['vite-plugin-static-copy'],
  // },
});

export default defineConfig(({ mode }) => {
  if (mode === 'web') {
    return createConfig('dist/web');
  }
  return createConfig('dist/renderer');
});
