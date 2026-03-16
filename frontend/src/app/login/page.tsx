"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Flame, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // OAuth2 password flow — FastAPI expects form-encoded body
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);

      const { data } = await api.post("/auth/token", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setAuth(data.access_token, {
        email,
        plan: data.plan ?? "free",
      });

      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">ViralCommerce</p>
            <p className="text-xs text-brand-400 leading-none mt-0.5">AI Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors">
              Create one free
            </Link>
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-gray-900" />
                <span className="text-xs text-gray-400">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 mb-2">🎮 Demo Account</p>
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              <p>Email: <span className="text-gray-300 font-mono">demo@viralcommerce.ai</span></p>
              <p>Password: <span className="text-gray-300 font-mono">Demo1234!</span></p>
            </div>
            <button
              onClick={() => {
                setEmail("demo@viralcommerce.ai");
                setPassword("Demo1234!");
              }}
              className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Fill credentials →
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By signing in you agree to our{" "}
          <span className="text-gray-500">Terms of Service</span> and{" "}
          <span className="text-gray-500">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
