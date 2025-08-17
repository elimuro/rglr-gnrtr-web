import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'

export default defineConfig({
  optimizeDeps: {
    include: ['p5', 'three', 'gsap']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  },
  publicDir: 'public',
  plugins: [
    {
      name: 'copy-help-files',
      writeBundle() {
        // Copy all help HTML files to dist directory after build
        const helpFiles = [
          'help.html',
          'help-animations.html',
          'help-general-setup.html',
          'help-parameters.html',
          'help-p5-layer.html',
          'help-presets-scenes.html'
        ]
        
        helpFiles.forEach(file => {
          const sourcePath = resolve(__dirname, file)
          const destPath = resolve(__dirname, 'dist', file)
          if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, destPath)
            console.log(`✓ Copied ${file} to dist directory`)
          }
        })
        
        // Copy tailwind.css to dist directory
        const cssSourcePath = resolve(__dirname, 'tailwind.css')
        const cssDestPath = resolve(__dirname, 'dist', 'tailwind.css')
        if (existsSync(cssSourcePath)) {
          copyFileSync(cssSourcePath, cssDestPath)
          console.log('✓ Copied tailwind.css to dist directory')
        }
      }
    }
  ]
}) 