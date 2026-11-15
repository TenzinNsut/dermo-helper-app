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
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full border border-emerald-400/80 bg-emerald-50/80 text-emerald-800 shadow-sm transition-all duration-300 animate-fade-in select-none ${className}`}
    >
      {/* Live status pulse dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
      </span>

      {/* Wifi Off icon */}
      <WifiOff className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" strokeWidth={2.2} />

      {/* Status text matching reference screenshot */}
      <span className="text-xs font-semibold tracking-tight whitespace-nowrap text-emerald-900">
        {variant === 'full' ? (
          'ONNX WASM Ready · 100% Offline'
        ) : variant === 'compact' ? (
          'Ready · 100% Offline'
        ) : (
          <>
            <span className="hidden sm:inline">ONNX WASM </span>
            <span>Ready · 100% Offline</span>
          </>
        )}
      </span>
    </div>
  );
};

export default OfflineReadyBadge;
