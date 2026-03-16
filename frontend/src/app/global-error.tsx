"use client";

import { useEffect } from "react";

/**
 * global-error.tsx — catches errors thrown by the root layout itself.
 * Must include <html> and <body> because it replaces the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error?.message, error?.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-white mb-2">
            Algo deu muito errado
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Erro crítico no layout da aplicação.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
