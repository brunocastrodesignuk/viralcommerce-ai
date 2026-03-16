"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Products] Client error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        Erro ao carregar produtos
      </h2>
      <p className="text-sm text-gray-400 mb-6 max-w-sm">
        Ocorreu um erro inesperado. Isso pode ser causado por instabilidade do
        servidor. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </button>
    </div>
  );
}
