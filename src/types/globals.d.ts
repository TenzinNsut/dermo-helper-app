interface Window {
  wasmMemory?: WebAssembly.Memory;
  useLightVersion?: boolean;
  appLoaded?: boolean;
}

declare module 'onnxruntime-web' {
  namespace env {
    namespace wasm {
      let wasmPaths: Record<string, string>;
      let numThreads: number;
      let simd: boolean;
      let proxy: boolean;
      let wasmMemory: WebAssembly.Memory;
    }
  }
} 