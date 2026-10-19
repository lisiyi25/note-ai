import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  // GitHub Pages 仓库名部署时使用 /note-ai/，本地开发用 /
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (content: string, filepath: string) => {
          if (filepath.replace(/\\/g, '/').includes('/styles/variables.scss')) {
            return content
          }
          return `@use "@/styles/variables.scss" as *;\n${content}`
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
