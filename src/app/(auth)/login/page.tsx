"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("Username atau password salah.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-sm p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center rounded-sm mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-center">
            Sistem Informasi Inventaris
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Portal Otentikasi Operasional
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-sm text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nama Pengguna
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 text-sm text-slate-900 dark:text-slate-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 text-sm text-slate-900 dark:text-slate-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm py-2 px-4 rounded-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 flex justify-center items-center h-10"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
