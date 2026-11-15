import { useState, useEffect } from 'react';
import { modelService } from '@/services/modelService';

/**
 * Custom hook to monitor whether the quantized ONNX model is loaded into
 * WebAssembly memory and ready to perform inferences 100% offline.
 *
 * @param autoInitialize When true, triggers background preloading of the model
 * @returns boolean indicating if the model session is initialized in memory
 */
export function useModelReady(autoInitialize: boolean = true): boolean {
  const [isReady, setIsReady] = useState<boolean>(() => modelService.isReady());

  useEffect(() => {
    // Subscribe to model readiness updates
    const unsubscribe = modelService.onReadyChange((ready) => {
      setIsReady(ready);
    });

    // Initiate background load if not yet initialized
    if (autoInitialize && !modelService.isReady()) {
      modelService.initialize().catch((err) => {
        console.warn('[useModelReady] Model background initialization failed:', err);
      });
    }

    return unsubscribe;
  }, [autoInitialize]);

  return isReady;
}

export default useModelReady;
