import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // supabase-js is the single largest dependency and is needed on
          // every route; isolating it lets browsers cache it independently
          // of the app code that changes far more often.
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
