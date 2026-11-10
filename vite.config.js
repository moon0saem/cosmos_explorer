import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages의 프로젝트 사이트 주소는 /cosmos_explorer/ 아래에 배포된다.
  // 개발 서버에서는 기존처럼 /를 사용한다.
  base: command === 'build' ? '/cosmos_explorer/' : '/',
  plugins: [react()],
}))
