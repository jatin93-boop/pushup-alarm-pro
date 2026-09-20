import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mediapipe-pose-stub',
      enforce: 'pre',
      resolveId(id) {
        if (id.includes('@mediapipe/pose')) {
          return '\0virtual:@mediapipe/pose'
        }
      },
      load(id) {
        if (id === '\0virtual:@mediapipe/pose') {
          return `
            export class Pose {}
            export const VERSION = '0.5.1635988162';
            export default { Pose, VERSION };
          `
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['@mediapipe/pose']
  }
})
