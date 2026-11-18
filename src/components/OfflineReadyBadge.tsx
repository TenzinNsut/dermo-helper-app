import React from 'react';
import { WifiOff } from 'lucide-react';
import { useModelReady } from '@/hooks/useModelReady';

export interface OfflineReadyBadgeProps {
  className?: string;
  autoInitialize?: boolean;
  variant?: 'full' | 'compact' | 'responsive';
}

/**
 * OfflineReadyBadge
 * Displays the "ONNX WASM Ready · 100% Offline" indicator pill.
 * Strictly renders ONLY after the ONNX model is initialized in WebAssembly memory.
 */
export const OfflineReadyBadge: React.FC<OfflineReadyBadgeProps> = ({
  className = '',
  autoInitialize = true,
  variant = 'responsive',
}) => {
  const isReady = useModelReady(autoInitialize);

  // STRICT REQUIREMENT: Only show once model is ready and can be run offline
  if (!isReady) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="ONNX WASM Model Ready, 100% Offline"
      title="The quantized ONNX model is loaded into WebAssembly memory. All inferences execute on-device 100% offline."
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-none sm:rounded-md border-2 border-black bg-emerald-300 text-black shadow-[2px_2px_0px_#000] font-mono text-xs font-bold transition-all select-none ${className}`}
    >
      {/* Live status pulse dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-black" />
      </span>

      {/* Wifi Off icon */}
      <WifiOff className="w-3.5 h-3.5 text-black flex-shrink-0" strokeWidth={2.5} />

      {/* Status text matching reference screenshot */}
      <span className="text-xs font-bold tracking-tight whitespace-nowrap text-black uppercase">
        {variant === 'full' ? (
          'ONNX WASM Ready · 100% Offline'
        ) : variant === 'compact' ? (
          'Ready · Offline'
        ) : (
          <>
            <span className="hidden sm:inline">ONNX WASM </span>
            <span>Ready · Offline</span>
          </>
        )}
      </span>
    </div>
  );
};

export default OfflineReadyBadge;
