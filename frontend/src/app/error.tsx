"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Root error boundary — catches unhandled errors in any page.
 * Renders inside the root layout (has sidebar/topbar context).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        Ocorreu um erro inesperado
      </h2>
      <p className="text-sm text-gray-400 mb-6 max-w-sm">
        O servidor pode estar reiniciando (Render free tier leva ~30 segundos).
        Aguarde e tente novamente.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl text-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
