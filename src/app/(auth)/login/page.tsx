"use client";

import React, { useState } from "react";
import { Lock, User, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { VedroLogo } from "@/components/shared/vedro-logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: username.trim(),
        email: username.trim(),
        password,
      });

      if (res?.error) {
        setError("Invalid username or password. Please verify your credentials.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string) => {
    setUsername(user);
    setPassword("admin123");
    setError("");
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center mb-6">
        <VedroLogo variant="dark" size="lg" className="mb-2" />
        <p className="text-[11px] text-[#F2EBD8]/80 uppercase tracking-widest font-semibold mt-1">
          Business Management Portal
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-7 shadow-2xl border border-[#E8E2D5]">
        <div className="mb-5 pb-3 border-b border-[#E8E2D5]">
          <h3 className="text-base font-bold text-[#493020]">Sign In</h3>
          <p className="text-[11px] text-[#77736A] mt-0.5">
            Enter your credentials to access the Vedro dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#77736A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl pl-9 pr-3 py-2.5 text-[#29271F] focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
                placeholder="admin or username"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#77736A] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#77736A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs bg-[#FCFAF3] border border-[#E8E2D5] rounded-xl pl-9 pr-3 py-2.5 text-[#29271F] focus:outline-none focus:ring-1 focus:ring-[#E4BF22] transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Quick Credential Badges */}
          <div className="pt-1">
            <span className="text-[10px] text-[#77736A] font-semibold block mb-1.5">
              Quick Sign In:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Admin", user: "admin" },
                { label: "Vineet", user: "vineet" },
                { label: "Vivek", user: "vivek" },
                { label: "Varunesh", user: "varunesh" },
              ].map((btn) => (
                <button
                  type="button"
                  key={btn.user}
                  onClick={() => handleQuickFill(btn.user)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                    username.toLowerCase() === btn.user
                      ? "bg-[#E4BF22] text-[#493020] border-[#E4BF22]"
                      : "bg-[#FCFAF3] text-[#77736A] border-[#E8E2D5] hover:text-[#493020]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#493020] bg-[#E4BF22] hover:bg-[#cfac18] disabled:opacity-50 rounded-xl transition-all shadow-xs active:scale-[0.99]"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-[#E8E2D5] flex items-center justify-between text-[11px] text-[#77736A]">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28764A]" />
            <span>Secure Session</span>
          </div>
          <span className="font-mono text-[10px]">FY 2026–27</span>
        </div>
      </div>
    </div>
  );
}
