import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // 导入插件

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // 使用插件
  ],
  server: {
    host: '0.0.0.0', // 允许通过局域网IP访问
    https: false,     // 启用HTTPS
  }
})