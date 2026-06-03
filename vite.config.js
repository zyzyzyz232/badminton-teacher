import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 与 gym_screen 默认 5173 区分，避免 H5 运行打开成大屏前端
export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5174,
    strictPort: false,
  },
})
