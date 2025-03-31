import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from the root of the project
      allow: ['..']
    },
    headers: {
      // Set correct MIME type for ONNX files
      'model-files': {
        source: '**/*.onnx',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream'
          }
        ]
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure the ONNX file is handled correctly
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  // Configure how Vite processes assets
  assetsInclude: ['**/*.onnx'],
}));
