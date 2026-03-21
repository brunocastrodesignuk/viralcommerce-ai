"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { OnboardingWizard } from "@/components/ui/OnboardingWizard";
import { usePreferences, applyTheme } from "@/store/preferences";

/** Syncs the Zustand auth token into the axios default headers on mount. */
function AuthSync() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  return null;
}

/**
 * Applies the saved theme CSS variables on every page mount and whenever
 * the theme changes — so colors never reset on navigation.
 */
function ThemeSync() {
  const theme = usePreferences((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}

/** Registers the PWA service worker */
function PWARegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service worker registered:", reg.scope))
        .catch((err) => console.warn("[PWA] Service worker registration failed:", err));
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,           // 1 min
            refetchInterval: 5 * 60 * 1000, // 5 min background refresh
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <ThemeSync />
      <PWARegistrar />
      <OnboardingWizard />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1F2937",
            color: "#F9FAFB",
            border: "1px solid #374151",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#F9FAFB" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#F9FAFB" } },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
